// MergeEngine.js
// Core text merge logic for your merge page.
// Pure functions only — no UI dependencies.

export function initializeMergedState(baseText) {
  return {
    mergedText: baseText,
    appliedBlocks: new Set(), // ids of accepted blocks
  };
}

/**
 * Applies a change from file1 (left).
 * currentState: { mergedText, appliedBlocks }
 * block: diff block JSON from backend
 */
export function applyBlockLeft(currentState, block) {
  const { mergedText, appliedBlocks } = currentState;

  if (appliedBlocks.has(block.id)) return currentState; // already applied

  const before = mergedText.slice(0, block.a.start);
  const after = mergedText.slice(block.a.end);
  const newMerged = before + block.a.text + after;

  return {
    mergedText: newMerged,
    appliedBlocks: new Set([...appliedBlocks, block.id]),
  };
}

/**
 * Applies a change from file2 (right).
 */
export function applyBlockRight(currentState, block) {
  const { mergedText, appliedBlocks } = currentState;

  if (appliedBlocks.has(block.id)) return currentState;

  const before = mergedText.slice(0, block.b.start);
  const after = mergedText.slice(block.b.end);
  const newMerged = before + block.b.text + after;

  return {
    mergedText: newMerged,
    appliedBlocks: new Set([...appliedBlocks, block.id]),
  };
}

/**
 * Undo a change (optional)
 */
export function undoBlock(currentState, blockId) {
  const { mergedText, appliedBlocks } = currentState;
  const newApplied = new Set(appliedBlocks);
  newApplied.delete(blockId);
  // (for simplicity, doesn’t revert the merged text — you can recompute)
  return { mergedText, appliedBlocks: newApplied };
}
