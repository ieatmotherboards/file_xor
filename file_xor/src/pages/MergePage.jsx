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

function CodeBlock({ code, language, startLine }) {
  return (
    <Highlight code={code ?? ""} language={language} theme={themes.vsDark}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={{ ...style, background: "transparent", margin: 0 }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              <span className="line-number">{(startLine ?? 1) + i}</span>
              <span className="code-line">
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </span>
            </div>
          ))}
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
  const {
    fileAName,
    fileBName,
    contentA,
    contentB,
    blocks: initialBlocks,
  } = location.state || {
    fileAName: "a.py",
    fileBName: "b.py",
    contentA: "print('Hello from file A')\nprint('Goodbye A')\n",
    contentB: "print('Hello from file B')\nprint('Goodbye B!')\n",
    blocks: [
      {
        id: "1",
        a: { start: 0, end: 26, text: "print('Hello from file A')" },
        b: { start: 0, end: 26, text: "print('Hello from file B')" },
      },
      {
        id: "2",
        a: { start: 27, end: 44, text: "print('Goodbye A')" },
        b: { start: 27, end: 45, text: "print('Goodbye B!')" },
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
