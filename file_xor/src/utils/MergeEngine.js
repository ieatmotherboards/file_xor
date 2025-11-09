// MergeEngine.js
// ------------------------------------------------------------
// Core merge logic + utilities for FILE XOR
// ------------------------------------------------------------
// Context-aware merging: Instead of using character indices (which drift
// as edits accumulate), we anchor each change by the unchanged lines
// around it. This ensures proper positioning even with multiple merges.
// ------------------------------------------------------------

/**
 * Represents the merge engine state:
 * {
 *   originalA: string,
 *   mergedText: string,
 *   choices: Map<blockId, "left"|"right">
 * }
 */

export function initializeMergedState(originalA) {
  return {
    originalA,
    mergedText: originalA,
    choices: new Map(), // blockId -> "left" | "right"
  };
}

function extractContext(text, startIndex, endIndex, contextLines = 2) {
  const lines = text.split("\n");
  const startLine1 = text.slice(0, startIndex).split("\n").length; // 1-based
  const endLine1   = text.slice(0, endIndex).split("\n").length;   // 1-based

  const startIdx0 = Math.max(0, startLine1 - 1); // 0-based index of the block's first line
  const endIdx0   = Math.max(startIdx0, endLine1 - 1); // 0-based (inclusive or last line index)

  // Collect up to N **non-empty** lines above / below as anchors
  const before = [];
  for (let i = startIdx0 - 1; i >= 0 && before.length < contextLines; i--) {
    if (lines[i].trim() !== "") before.unshift(lines[i]);
  }

  const after = [];
  for (let i = endIdx0 + 1; i < lines.length && after.length < contextLines; i++) {
    if (lines[i].trim() !== "") after.push(lines[i]);
  }

  return {
    before,           // non-empty anchor lines above
    after,            // non-empty anchor lines below
    startLine0: startIdx0, // 0-based line index of block start
    endLine0: endIdx0      // 0-based line index of block end
  };
}


/**
 * Find where a context pattern appears in the target lines.
 * Returns the index where the pattern starts, or -1 if not found.
 */
function findContextMatch(targetLines, contextBefore, contextAfter) {
  // Try to find the "before" context
  for (let i = 0; i <= targetLines.length - contextBefore.length; i++) {
    let match = true;
    for (let j = 0; j < contextBefore.length; j++) {
      if (targetLines[i + j] !== contextBefore[j]) {
        match = false;
        break;
      }
    }
    
    if (match) {
      // Found before context, verify after context exists
      const expectedAfterStart = i + contextBefore.length;
      // The actual content goes here, skip it to check after context
      
      // For now, return the position after the before context
      return i + contextBefore.length;
    }
  }
  
  // Fallback: try to find after context
  if (contextAfter.length > 0) {
    for (let i = 0; i <= targetLines.length - contextAfter.length; i++) {
      let match = true;
      for (let j = 0; j < contextAfter.length; j++) {
        if (targetLines[i + j] !== contextAfter[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        return i; // Insert before the after context
      }
    }
  }
  
  return -1;
}




/**
 * Finds the best insertion line for a block, correcting for extra blank lines.
 * Searches downward from the nominal start until it finds real code or context.
 */
function findAdjustedStartLine(lines, nominalStart, contextBefore) {
  let line = nominalStart;
  const maxLookahead = 5;

  // Move forward if we're sitting in whitespace or comment-only region
  while (
    line < lines.length &&
    line - nominalStart < maxLookahead &&
    lines[line].trim() === ""
  ) {
    line++;
  }

  // If contextBefore exists, try to match it slightly further down
  if (contextBefore?.length) {
    for (let i = Math.max(0, line - 2); i < Math.min(lines.length, line + 4); i++) {
      let match = true;
      for (let j = 0; j < contextBefore.length; j++) {
        if (lines[i + j] !== contextBefore[j]) {
          match = false;
          break;
        }
      }
      if (match) return i + contextBefore.length;
    }
  }

  return line;
}


// Try to locate a position using before/after anchors, preferring the occurrence
// closest to the nominalStart. Returns 0-based targetStart, or -1.
function findTargetStartWithAnchors(lines, beforeCtx, afterCtx, nominalStart) {
  const candidates = [];

  // scan for BEFORE context occurrences
  if (beforeCtx && beforeCtx.length) {
    for (let i = 0; i <= lines.length - beforeCtx.length; i++) {
      let ok = true;
      for (let j = 0; j < beforeCtx.length; j++) {
        if (lines[i + j] !== beforeCtx[j]) { ok = false; break; }
      }
      if (ok) candidates.push(i + beforeCtx.length); // start just after BEFORE
    }
  }

  // refine with AFTER context if available (keep only candidates that see AFTER ahead)
  if (afterCtx && afterCtx.length && candidates.length) {
    const filtered = [];
    for (const start of candidates) {
      let found = false;
      for (let k = start; k <= lines.length - afterCtx.length; k++) {
        let ok = true;
        for (let j = 0; j < afterCtx.length; j++) {
          if (lines[k + j] !== afterCtx[j]) { ok = false; break; }
        }
        if (ok) { found = true; break; }
      }
      if (found) filtered.push(start);
    }
    if (filtered.length) return filtered.reduce((best, s) =>
      Math.abs(s - nominalStart) < Math.abs(best - nominalStart) ? s : best
    , filtered[0]);
  }

  if (candidates.length) {
    // pick the one closest to nominal line
    return candidates.reduce((best, s) =>
      Math.abs(s - nominalStart) < Math.abs(best - nominalStart) ? s : best
    , candidates[0]);
  }

  // try AFTER-only: insert right before AFTER
  if (afterCtx && afterCtx.length) {
    for (let i = 0; i <= lines.length - afterCtx.length; i++) {
      let ok = true;
      for (let j = 0; j < afterCtx.length; j++) {
        if (lines[i + j] !== afterCtx[j]) { ok = false; break; }
      }
      if (ok) return i;
    }
  }

  return -1;
}



/**
 * Context-aware merge: rebuilds the merged text by anchoring each
 * change to its surrounding unchanged lines.
 */
export function computeMergedFromChoices(originalA, blocks, choices) {
  // Start with original as baseline
  let mergedLines = originalA.split("\n");
  
  // Sort blocks by original position
  const ordered = [...blocks].sort((x, y) => x.a.start - y.a.start);
  
  // Build a list of edits to apply
  const edits = [];
  
  for (const block of ordered) {
    const pick = choices.get(block.id);
    if (!pick) continue; // Skip undecided blocks
    
    const chosenText = pick === "left" ? block.a.text : block.b.text;
    const originalText = originalA.slice(block.a.start, block.a.end);
    
    // Extract context from original
    const ctx = extractContext(originalA, block.a.start, block.a.end, 2);

    edits.push({
      blockId: block.id,
      contextBefore: ctx.before,     // non-empty anchors
      contextAfter:  ctx.after,
      originalStart0: ctx.startLine0,  // 0-based
      originalEnd0:   ctx.endLine0,    // 0-based
      originalLines: originalA.slice(block.a.start, block.a.end).split("\n"),
      replacementLines: (choices.get(block.id) === "left" ? block.a.text : block.b.text).split("\n"),
    });
  }
  
  // Apply edits from bottom to top to preserve line indices
  edits.sort((a, b) => b.originalStart0 - a.originalStart0);
  
  for (const edit of edits) {
    // Find where to apply this edit using context
    // Find where to apply this edit using context anchors (Change C)
let targetStart = findTargetStartWithAnchors(
  mergedLines,
  edit.contextBefore,
  edit.contextAfter,
  edit.originalStart0 // 0-based
);

if (targetStart === -1) {
  targetStart = findAdjustedStartLine(
    mergedLines,
    edit.originalStart0,
    edit.contextBefore
  );
}

// Calculate targetEnd based on after-context or span length (Change D)
let targetEnd = targetStart;

if (edit.contextAfter.length > 0) {
  for (let i = targetStart; i <= mergedLines.length - edit.contextAfter.length; i++) {
    let ok = true;
    for (let j = 0; j < edit.contextAfter.length; j++) {
      if (mergedLines[i + j] !== edit.contextAfter[j]) { ok = false; break; }
    }
    if (ok) { targetEnd = i; break; }
  }
  if (targetEnd === targetStart) {
    targetEnd = targetStart + edit.originalLines.length;
  }
} else {
  targetEnd = targetStart + edit.originalLines.length;
}

// Apply the replacement
mergedLines.splice(targetStart, targetEnd - targetStart, ...edit.replacementLines);

    // Apply the replacement
    mergedLines.splice(targetStart, targetEnd - targetStart, ...edit.replacementLines);
  }
  
  return mergedLines.join("\n");
}

/**
 * Enhanced version that returns both merged text AND line mapping.
 */
export function computeMergedWithLineTracking(originalA, blocks, choices) {
  const text = computeMergedFromChoices(originalA, blocks, choices);
  const blockLineMap = new Map();
  
  // For line tracking, we need to walk through and find where each block ended up
  const lines = text.split("\n");
  
  for (const block of blocks) {
    const pick = choices.get(block.id);
    if (!pick) continue;
    
    const chosenText = pick === "left" ? block.a.text : block.b.text;
    const chosenLines = chosenText.split("\n");
    
    // Try to find these lines in the merged output
    for (let i = 0; i <= lines.length - chosenLines.length; i++) {
      let match = true;
      for (let j = 0; j < chosenLines.length; j++) {
        if (lines[i + j] !== chosenLines[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        blockLineMap.set(block.id, i + 1); // 1-based line number
        break;
      }
    }
  }
  
  return { text, blockLineMap };
}

/**
 * Applies a user decision ("left" or "right") to the merge state.
 */
export function applyChoice(currentState, blocks, block, side) {
  const nextChoices = new Map(currentState.choices);
  const already = nextChoices.get(block.id);

  if (already === side) {
    nextChoices.delete(block.id);
  } else {
    nextChoices.set(block.id, side);
  }

  const mergedText = computeMergedFromChoices(
    currentState.originalA,
    blocks,
    nextChoices
  );

  return {
    originalA: currentState.originalA,
    mergedText,
    choices: nextChoices,
  };
}

/**
 * Enhanced applyChoice that also returns line mapping.
 */
export function applyChoiceWithTracking(currentState, blocks, block, side) {
  const nextChoices = new Map(currentState.choices);
  const already = nextChoices.get(block.id);

  if (already === side) {
    nextChoices.delete(block.id);
  } else {
    nextChoices.set(block.id, side);
  }

  const { text, blockLineMap } = computeMergedWithLineTracking(
    currentState.originalA,
    blocks,
    nextChoices
  );

  return {
    originalA: currentState.originalA,
    mergedText: text,
    choices: nextChoices,
    blockLineMap,
  };
}

/**
 * Utility to merge adjacent or overlapping diff "blocks" into unified chunks.
 * This makes multi-line edits appear as single cohesive blocks in the UI.
 * 
 * @param {Array} blocks - Array of diff objects from backend.
 * @param {number} gap - Allowed character-gap threshold to consider blocks adjacent.
 */
export function mergeAdjacentBlocks(blocks, gap = 1) {
  if (!Array.isArray(blocks)) return [];
  
  const sorted = [...blocks].sort((a, b) => a.a.start - b.a.start);
  const merged = [];
  let current = null;

  for (const b of sorted) {
    if (
      current &&
      b.a.start <= current.a.end + gap &&
      b.b.start <= current.b.end + gap
    ) {
      current.a.end = b.a.end;
      current.b.end = b.b.end;
      current.a.text += "\n" + b.a.text;
      current.b.text += "\n" + b.b.text;
    } else {
      if (current) merged.push(current);
      current = { ...b };
    }
  }
  
  if (current) merged.push(current);
  return merged;
}

/**
 * Helper to count lines in a string
 */
export function countLines(text) {
  if (!text) return 0;
  return text.split("\n").length;
}

/**
 * Helper to get line number at a specific character index
 */
export function getLineAtIndex(text, index) {
  return text.slice(0, index).split("\n").length;
}

/**
 * Debug helper: Print the merge state for debugging
 */
export function debugMergeState(originalA, blocks, choices) {
  console.log("=== MERGE DEBUG ===");
  console.log("Original A lines:", originalA.split("\n").length);
  
  blocks.forEach(block => {
    const choice = choices.get(block.id);
    const context = extractContext(originalA, block.a.start, block.a.end, 1);
    
    console.log(`\nBlock: ${block.id}`);
    console.log(`  Choice: ${choice || "none"}`);
    console.log(`  Original lines: ${context.startLine + 1}-${context.endLine}`);
    console.log(`  Context before:`, context.before);
    console.log(`  Context after:`, context.after);
    
    if (choice) {
      const chosen = choice === "left" ? block.a.text : block.b.text;
      console.log(`  Chosen text:`, chosen.split("\n")[0] + "...");
    }
  });
}