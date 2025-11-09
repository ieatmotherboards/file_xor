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
 */
export function computeMergedFromChoices(originalA, blocks, choices) {
  const ordered = [...blocks].sort((x, y) => x.a.start - y.a.start);

  let out = "";
  let cursor = 0;

  for (const b of ordered) {
    // Append unmodified region before this block
    out += originalA.slice(cursor, b.a.start);

    const pick = choices.get(b.id);
    if (pick === "left") out += b.a.text;
    else if (pick === "right") out += b.b.text;
    else out += originalA.slice(b.a.start, b.a.end); // unchanged region

    cursor = b.a.end;
  }

  // Append the tail after the final block
  out += originalA.slice(cursor);
  return out;
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


export function computeMergedFromChoicesWithLineMap(originalA, blocks, choices) {
  const ordered = [...blocks].sort((x, y) => x.a.start - y.a.start);

  let out = "";
  let cursor = 0;
  let currentLine = 1;       // 1-based
  const lineMap = new Map(); // blockId -> mergedStartLine

  const countNL = (s) => (s.match(/\n/g) || []).length;

  for (const b of ordered) {
    // unchanged region before the block
    const pre = originalA.slice(cursor, b.a.start);
    out += pre;
    currentLine += countNL(pre);

    // record merged start line for the block (before inserting chosen text)
    const pick = choices.get(b.id);
    lineMap.set(b.id, currentLine);

    if (pick === "left") {
      out += b.a.text;
      currentLine += countNL(b.a.text);
    } else if (pick === "right") {
      out += b.b.text;
      currentLine += countNL(b.b.text);
    } else {
      const unchanged = originalA.slice(b.a.start, b.a.end);
      out += unchanged;
      currentLine += countNL(unchanged);
    }

    cursor = b.a.end;
  }

  // tail
  const tail = originalA.slice(cursor);
  out += tail;
  // currentLine += countNL(tail); // not needed unless you use it later

  return { text: out, lineMap };
}