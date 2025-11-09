import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Highlight, themes } from "prism-react-renderer";
import {
  initializeMergedState,
  applyChoice,
  computeMergedFromChoices,
} from "../utils/MergeEngine";
import "../styles/MergeEngine.css";

/* ---------- helpers ---------- */
function detectLanguage(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map = {
    py: "python",
    js: "javascript",
    ts: "typescript",
    java: "java",
    html: "html",
    css: "css",
    cpp: "cpp",
    c: "cpp",
    json: "json",
    md: "markdown",
  };
  return map[ext] || "python";
}
function countLinesUntil(text, index) {
  return text.slice(0, index).split("\n").length;
}

// pages/MergePage.jsx (or a separate component file)
function CodeBlock({
  code,
  language,
  startLine = 1,
  withLineWrappers = false,          // NEW
  anchorLines = new Map(),           // NEW: Map<blockId, lineNumber>
}) {
  // Build quick reverse map line -> [blockIds...]
  const lineToAnchors = useMemo(() => {
    const m = new Map();
    anchorLines.forEach((ln, blockId) => {
      if (!m.has(ln)) m.set(ln, []);
      m.get(ln).push(blockId);
    });
    return m;
  }, [anchorLines]);

  return (
    <Highlight code={code ?? ""} language={language} theme={themes.vsDark}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={{ ...style, background: "transparent", margin: 0 }}>
          {tokens.map((line, i) => {
            const displayLine = startLine + i;

            // Render a wrapper div per line so we can measure positions
            const lineProps = withLineWrappers
              ? { "data-line": displayLine }
              : {};

            return (
              <div key={i} {...getLineProps({ line, key: i })} {...lineProps}>
                {/* Optional: invisible anchors inserted BEFORE the line */}
                {withLineWrappers && lineToAnchors.has(displayLine) &&
                  lineToAnchors.get(displayLine).map((blockId) => (
                    <span
                      key={`anchor-${blockId}`}
                      data-anchor-for={blockId}
                      style={{ position: "absolute", height: 0, width: 0 }}
                    />
                  ))}

                <span className="line-number">{displayLine}</span>
                <span className="code-line">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}

/* ---------- animation presets ---------- */
// subtle lift to show persistent focus after clicking
const focusLift = { z: 24, scale: 1.03, transition: { duration: 0.22 } };

/* ---------- main ---------- */
export default function MergePage() {
  const location = useLocation();
  const { fileAName, fileBName, contentA, contentB, blocks: initialBlocks } =
  location.state || {
    fileAName: "fileA.py",
    fileBName: "fileB.py",
    contentA: `# fileA.py - Base version

def greet(name):
    print(f"Hello, {name}!")

def add(a, b):
    return a + b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        print("Cannot divide by zero!")
        return None
    return a / b

def factorial(n):
    if n == 0:
        return 1
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

def summarize(values):
    total = sum(values)
    avg = total / len(values)
    print(f"Sum: {total}, Average: {avg}")

def main():
    greet("Alice")
    print(add(5, 10))
    print(multiply(3, 7))
    summarize([2, 4, 6, 8])

if __name__ == "__main__":
    main()
`,

    contentB: `# fileB.py - Modified version

def greet(name, excited=False):
    message = f"Hello, {name}"
    if excited:
        message += "!!!"
    print(message)

def add(a, b):
    # Added type checking
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("add() arguments must be numbers")
    return a + b

def multiply(a, b):
    return a * b

def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("Error: divide by zero")
        return None

def factorial(n):
    if n < 0:
        raise ValueError("n must be non-negative")
    if n == 0:
        return 1
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

def summarize(values):
    total = sum(values)
    avg = total / len(values)
    print(f"Total={total}, Mean={avg}")

def main():
    greet("Alice", excited=True)
    print(add(5, 10))
    print(multiply(3, 7))
    summarize([2, 4, 6, 8])

if __name__ == "__main__":
    main()
`,
    // fake diff structure for demo purposes
    blocks: [
      {
        id: "greet-func",
        a: {
          start: 22,
          end: 60,
          text: `def greet(name):
    print(f"Hello, {name}!")`,
        },
        b: {
          start: 22,
          end: 98,
          text: `def greet(name, excited=False):
    message = f"Hello, {name}"
    if excited:
        message += "!!!"
    print(message)`,
        },
      },
      {
        id: "divide-func",
        a: {
          start: 166,
          end: 226,
          text: `def divide(a, b):
    if b == 0:
        print("Cannot divide by zero!")
        return None
    return a / b`,
        },
        b: {
          start: 176,
          end: 243,
          text: `def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("Error: divide by zero")
        return None`,
        },
      },
      {
        id: "summarize-func",
        a: {
          start: 338,
          end: 389,
          text: `def summarize(values):
    total = sum(values)
    avg = total / len(values)
    print(f"Sum: {total}, Average: {avg}")`,
        },
        b: {
          start: 345,
          end: 394,
          text: `def summarize(values):
    total = sum(values)
    avg = total / len(values)
    print(f"Total={total}, Mean={avg}")`,
        },
      },
    ],
  };

  const language = detectLanguage(fileAName || fileBName);

  // merge engine state
  const [engine, setEngine] = useState(() =>
    initializeMergedState(contentA || "")
  );

  // active (undecided) blocks and decided blocks
  const [activeBlocks, setActiveBlocks] = useState(initialBlocks);
  const [decidedBlocks, setDecidedBlocks] = useState([]); // [{block, chosen:'left'|'right'}]
  const [decidedOpen, setDecidedOpen] = useState(true);

  // selection / focus
  const [focusedId, setFocusedId] = useState(null); // persistent highlight
  const [barSelection, setBarSelection] = useState(null); // {block}

  // fly clone animation state
  const [fly, setFly] = useState(null); // { id, side, fromRect, toRect, code }

  // refs to measure positions
  const mergePaneRef = useRef(null);
  const chunkRefsLeft = useRef(new Map());
  const chunkRefsRight = useRef(new Map());

  // keep engine baseline synced to contentA if it changes
  useEffect(() => {
    setEngine((prev) =>
      prev.originalA === (contentA || "")
        ? prev
        : initializeMergedState(contentA || "")
    );
  }, [contentA]);

  // always-visible lists: both sides render immediately
  const leftList = useMemo(() => activeBlocks, [activeBlocks]);
  const rightList = useMemo(() => activeBlocks, [activeBlocks]);

  const choiceOf = (id) => engine.choices.get(id); // 'left'|'right'|undefined

  // clicking a chunk sets focus and shows decision bar
  const onChunkClick = (side, block) => {
    setFocusedId(block.id); // persistent highlight until click-off
    setBarSelection({ block }); // does not change the opposite chunk
  };

  // click-off (background) clears focus
  const clearFocus = (e) => {
    // don't clear when clicking inside selection bar
    if (e.target.closest?.(".selection-bar")) return;
    setFocusedId(null);
  };

  // compute starting line for each chunk from A indexes
  const startLineFor = (b) => countLinesUntil(contentA || "", b.a.start);

  // accept handler: plays cinematic clone + updates engine + moves blocks
  const handleAccept = (block, side) => {
    // 1) measure source rect
    const sourceEl =
      (side === "left"
        ? chunkRefsLeft.current.get(block.id)
        : chunkRefsRight.current.get(block.id)) || null;
    const fromRect = sourceEl?.getBoundingClientRect?.();

    // 2) measure destination rect: center merge pane (approximate landing)
    const mergeRect = mergePaneRef.current?.getBoundingClientRect?.();
    // We try to land near the vertical spot where the merged text for this block would be.
    // As an approximation (no caret measurement), we land in the middle of the merge pane.
    const toRect = mergeRect && {
      x: mergeRect.x + mergeRect.width * 0.1,
      y: mergeRect.y + mergeRect.height * 0.35,
      width: mergeRect.width * 0.8,
      height: 40,
    };

    // 3) create fly clone (does not remove original chunks)
    setFly({
      id: block.id,
      side,
      fromRect,
      toRect,
      code: side === "left" ? block.a.text : block.b.text,
    });

    // 4) update merge text (last click wins)
    const next = applyChoice(engine, activeBlocks, block, side);
    setEngine(next);

    // 5) after the fly finishes:
    setTimeout(() => {
      // a) move this pair into decided
      setDecidedBlocks((prev) => [...prev, { block, chosen: side }]);
      // b) remove from active list (so they don’t clutter)
      setActiveBlocks((prev) => prev.filter((x) => x.id !== block.id));
      // c) clear fly + bar; keep focus until user clicks off
      setFly(null);
      setBarSelection(null);
    }, 700);
  };

  // rejected slide-up animation: the REJECTED chunk animates upward into the decided panel
  // (We achieve this by letting AnimatePresence control exit on the active list.)

  // mapping helpers to attach refs
  const setLeftRef = (id) => (el) => {
    if (!el) chunkRefsLeft.current.delete(id);
    else chunkRefsLeft.current.set(id, el);
  };
  const setRightRef = (id) => (el) => {
    if (!el) chunkRefsRight.current.delete(id);
    else chunkRefsRight.current.set(id, el);
  };

  // fly styles (absolute clone)
  const flyStyle =
    fly && fly.fromRect && fly.toRect
      ? {
          position: "fixed",
          left: fly.fromRect.x,
          top: fly.fromRect.y,
          width: fly.fromRect.width,
          zIndex: 200,
        }
      : null;

  return (
    <div className="merge-root" onMouseDown={clearFocus}>
      <header className="merge-navbar">FILE XOR</header>

      {/* Decided changes accordion */}
      <div className="decided-wrap">
        <button
          className="decided-toggle"
          onClick={() => setDecidedOpen((s) => !s)}
        >
          {decidedOpen ? "▼" : "▶"} Merged Changes ({decidedBlocks.length})
        </button>
        <AnimatePresence initial={false}>
          {decidedOpen && (
            <motion.div
              className="decided-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {decidedBlocks.map(({ block, chosen }) => (
                <div key={`decided-${block.id}`} className="decided-row">
                  <span className="decided-tag">
                    {chosen === "left" ? "Accepted Left" : "Accepted Right"}
                  </span>
                  <span className="decided-preview">
                    {(chosen === "left" ? block.a.text : block.b.text).slice(
                      0,
                      120
                    )}
                    {((chosen === "left" ? block.a.text : block.b.text) || "")
                      .length > 120 && "…"}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="merge-container perspective">
        {/* LEFT */}
        <div className="merge-pane left-pane">
          <AnimatePresence mode="popLayout">
            {leftList.map((b) => {
              const startLine = startLineFor(b);
              const choice = engine.choices.get(b.id);
              return (
                <motion.div
                  key={b.id + "-left"}
                  ref={setLeftRef(b.id)}
                  className={`chunk ${
                    focusedId === b.id ? "focused" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChunkClick("left", b);
                  }}
                  layout
                  animate={focusedId === b.id ? "focus" : "rest"}
                  variants={{ focus: focusLift, rest: { z: 0, scale: 1 } }}
                  exit={{
                    // rejected chunk slides up when decided
                    y: -12,
                    opacity: 0,
                    transition: { duration: 0.18 },
                  }}
                >
                  <CodeBlock
                    code={b.a.text}
                    language={language}
                    startLine={startLine}
                  />
                  {choice && (
                    <div
                      className={`choice-badge ${
                        choice === "left" ? "check" : "cross"
                      }`}
                    >
                      {choice === "left" ? "✔" : "❌"}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* MERGED */}
        <motion.div layout ref={mergePaneRef} className="merge-output">
          <CodeBlock
            code={computeMergedFromChoices(
              engine.originalA,
              [...activeBlocks, ...decidedBlocks.map((d) => d.block)],
              engine.choices
            )}
            language={language}
            startLine={1}
          />
        </motion.div>

        {/* RIGHT */}
        <div className="merge-pane right-pane">
          <AnimatePresence mode="popLayout">
            {rightList.map((b) => {
              const startLine = startLineFor(b);
              const choice = engine.choices.get(b.id);
              return (
                <motion.div
                  key={b.id + "-right"}
                  ref={setRightRef(b.id)}
                  className={`chunk ${
                    focusedId === b.id ? "focused" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChunkClick("right", b);
                  }}
                  layout
                  animate={focusedId === b.id ? "focus" : "rest"}
                  variants={{ focus: focusLift, rest: { z: 0, scale: 1 } }}
                  exit={{
                    // rejected chunk slides up when decided
                    y: -12,
                    opacity: 0,
                    transition: { duration: 0.18 },
                  }}
                >
                  <CodeBlock
                    code={b.b.text}
                    language={language}
                    startLine={startLine}
                  />
                  {choice && (
                    <div
                      className={`choice-badge ${
                        choice === "right" ? "check" : "cross"
                      }`}
                    >
                      {choice === "right" ? "✔" : "❌"}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* FLY CLONE — lift → glide (downward) → slam above center */}
        <AnimatePresence>
          {fly && fly.fromRect && fly.toRect && (
            <motion.div
              className="fly-clone"
              style={{
                position: "fixed",
                left: fly.fromRect.x,
                top: fly.fromRect.y,
                width: fly.fromRect.width,
                zIndex: 250,
              }}
              initial={{ scale: 1, opacity: 0.95 }}
              animate={{
                // phase 1: toward user
                scale: 1.12,
                y: fly.toRect.y - fly.fromRect.y - 28,
                x: fly.toRect.x - fly.fromRect.x,
                rotateX: 4,
                transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{
                // phase 2: settle (slam) — small overshoot back to 1
                scale: [1.12, 1.0, 1.02, 1.0],
                y: [fly.toRect.y - fly.fromRect.y - 28, fly.toRect.y - fly.fromRect.y, fly.toRect.y - fly.fromRect.y + 4, fly.toRect.y - fly.fromRect.y],
                x: fly.toRect.x - fly.fromRect.x,
                opacity: 1,
                rotateX: 0,
                transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] },
              }}
            >
              <div className="chunk clone">
                <CodeBlock
                  code={fly.code}
                  language={language}
                  startLine={1}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent decision bar; focus persists until click-off */}
      <AnimatePresence>
        {barSelection && (
          <motion.div
            className="selection-bar"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <p>Choose which version to keep</p>
            <div className="bar-buttons">
              <button
                className="accept-left"
                onClick={() => handleAccept(barSelection.block, "left")}
              >
                Accept Left
              </button>
              <button
                className="accept-right"
                onClick={() => handleAccept(barSelection.block, "right")}
              >
                Accept Right
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
