// MergeEngine.js
// Rebuilds merged text deterministically from the original A file.

export function initializeMergedState(originalA) {
  return {
    originalA,
    mergedText: originalA,
    choices: new Map(), // { blockId: "left" | "right" }
  };
}

export function computeMergedFromChoices(originalA, blocks, choices) {
  const ordered = [...blocks].sort((a, b) => a.a.start - b.a.start);
  let result = "";
  let cursor = 0;

  for (const b of ordered) {
    result += originalA.slice(cursor, b.a.start);
    const pick = choices.get(b.id);
    if (pick === "left") result += b.a.text;
    else if (pick === "right") result += b.b.text;
    else result += originalA.slice(b.a.start, b.a.end);
    cursor = b.a.end;
  }
  result += originalA.slice(cursor);
  return result;
}

export function applyChoice(state, blocks, block, side) {
  const nextChoices = new Map(state.choices);
  nextChoices.set(block.id, side);
  const mergedText = computeMergedFromChoices(
    state.originalA,
    blocks,
    nextChoices
  );
  return {
    ...state,
    mergedText,
    choices: nextChoices,
  };
}
