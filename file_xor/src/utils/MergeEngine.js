// MergeEngine.js
// ------------------------------------------------------------
// Core merge logic + utilities for FILE XOR
// ------------------------------------------------------------
// This file handles deterministic merging of two versions of text
// based on user decisions. It also includes helper utilities for
// grouping nearby changes into larger, logical chunks ("hunks").
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

/**
 * Deterministically rebuild merged text from originalA + current user choices.
 * This ensures reproducibility (no index drift as edits accumulate).
 * 
 * FIXED: Now returns both text and line mapping for accurate positioning
 */
export function computeMergedFromChoices(originalA, blocks, choices) {
  const ordered = [...blocks].sort((x, y) => x.a.start - y.a.start);

  let out = "";
  let cursor = 0;
  let currentLine = 1; // Track current line number in merged output
  const blockLineMap = new Map(); // blockId -> starting line in merged output

  const countNewlines = (text) => (text.match(/\n/g) || []).length;

  for (const b of ordered) {
    // Append unmodified region before this block
    const beforeText = originalA.slice(cursor, b.a.start);
    out += beforeText;
    currentLine += countNewlines(beforeText);

    // Record where this block starts in the merged output
    blockLineMap.set(b.id, currentLine);

    // Determine which text to insert
    const pick = choices.get(b.id);
    let chosenText;
    
    if (pick === "left") {
      chosenText = b.a.text;
    } else if (pick === "right") {
      chosenText = b.b.text;
    } else {
      // No choice made yet, use original text
      chosenText = originalA.slice(b.a.start, b.a.end);
    }

    out += chosenText;
    currentLine += countNewlines(chosenText);
    cursor = b.a.end;
  }

  // Append the tail after the final block
  out += originalA.slice(cursor);
  
  return out;
}

/**
 * Enhanced version that returns both merged text and line mapping
 * Use this when you need to know where blocks appear in the merged output
 */
export function computeMergedWithLineTracking(originalA, blocks, choices) {
  const ordered = [...blocks].sort((x, y) => x.a.start - y.a.start);

  let out = "";
  let cursor = 0;
  let currentLine = 1;
  const blockLineMap = new Map(); // blockId -> starting line in merged output

  const countNewlines = (text) => (text.match(/\n/g) || []).length;

  for (const b of ordered) {
    // Append unmodified region before this block
    const beforeText = originalA.slice(cursor, b.a.start);
    out += beforeText;
    currentLine += countNewlines(beforeText);

    // Record where this block starts in the merged output
    blockLineMap.set(b.id, currentLine);

    // Determine which text to insert
    const pick = choices.get(b.id);
    let chosenText;
    
    if (pick === "left") {
      chosenText = b.a.text;
    } else if (pick === "right") {
      chosenText = b.b.text;
    } else {
      // No choice made yet, use original text
      chosenText = originalA.slice(b.a.start, b.a.end);
    }

    out += chosenText;
    currentLine += countNewlines(chosenText);
    cursor = b.a.end;
  }

  // Append the tail after the final block
  const tail = originalA.slice(cursor);
  out += tail;
  
  return { 
    text: out, 
    blockLineMap // Map of blockId -> line number where it appears in merged output
  };
}

/**
 * Applies a user decision ("left" or "right") to the merge state.
 * If a block is re-selected with the same choice, we toggle it off.
 */
export function applyChoice(currentState, blocks, block, side /* 'left'|'right' */) {
  const nextChoices = new Map(currentState.choices);
  const already = nextChoices.get(block.id);

  if (already === side) {
    // Undo this block if same side clicked again
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
 * Enhanced applyChoice that also returns line mapping
 */
export function applyChoiceWithTracking(currentState, blocks, block, side) {
  const nextChoices = new Map(currentState.choices);
  const already = nextChoices.get(block.id);

  if (already === side) {
    // Undo this block if same side clicked again
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
    blockLineMap, // NEW: line positions in merged output
  };
}

/**
 * Utility to merge adjacent or overlapping diff "blocks" into unified chunks.
 * This makes multi-line edits appear as single cohesive blocks in the UI.
 * 
 * @param {Array} blocks - Array of diff objects from backend.
 * @param {number} gap - Allowed line-gap threshold to consider blocks adjacent.
 */
export function mergeAdjacentBlocks(blocks, gap = 1) {
  if (!Array.isArray(blocks)) return [];
  const merged = [];
  const sorted = [...blocks].sort((a, b) => a.a.start - b.a.start);
  let current = null;

  for (const b of sorted) {
    if (
      current &&
      b.a.start <= current.a.end + gap &&
      b.b.start <= current.b.end + gap
    ) {
      // Extend current chunk
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