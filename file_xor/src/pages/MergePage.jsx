// src/pages/MergePage.jsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  applyBlockLeft,
  applyBlockRight,
  initializeMergedState,
} from "../utils/MergeEngine";
import "../styles/MergeEngine.css";

export default function MergePage() {
  const location = useLocation();
  const { fileA, fileB, blocks } = location.state || {
    fileA: "print('Hello from file A')\nprint('Goodbye A')",
    fileB: "print('Hello from file B')\nprint('Goodbye B!')",
    blocks: [
      {
        id: "test1",
        kind: "replace",
        a: { start: 0, end: 26, text: "print('Hello from file A')" },
        b: { start: 0, end: 26, text: "print('Hello from file B')" },
      },
      {
        id: "test2",
        kind: "replace",
        a: { start: 27, end: 44, text: "print('Goodbye A')" },
        b: { start: 27, end: 45, text: "print('Goodbye B!')" },
      },
    ],
  };

  const [state, setState] = useState(initializeMergedState(fileA));
  const [hoveredId, setHoveredId] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleAccept = (block, side) => {
    const newState =
      side === "left"
        ? applyBlockLeft(state, block)
        : applyBlockRight(state, block);
    setState(newState);
    setSelected(null);
  };

  return (
    <div className="merge-root">
      {/* Placeholder navbar */}
      <header className="merge-navbar">FILE XOR</header>

      <div className="merge-container">
        {/* LEFT */}
        <div className="merge-pane left-pane">
          {blocks.map((b) => (
            <motion.div
              key={b.id + "-a"}
              layout
              className={`chunk ${state.appliedBlocks.has(b.id) ? "accepted" : ""} ${
                hoveredId === b.id ? "hovered" : ""
              }`}
              onHoverStart={() => setHoveredId(b.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => setSelected({ side: "left", block: b })}
            >
              <pre>{b.a.text}</pre>
            </motion.div>
          ))}
        </div>

        {/* MERGED OUTPUT */}
        <motion.div layout className="merge-output">
          <pre>{state.mergedText}</pre>
        </motion.div>

        {/* RIGHT */}
        <div className="merge-pane right-pane">
          {blocks.map((b) => (
            <motion.div
              key={b.id + "-b"}
              layout
              className={`chunk ${state.appliedBlocks.has(b.id) ? "accepted" : ""} ${
                hoveredId === b.id ? "hovered" : ""
              }`}
              onHoverStart={() => setHoveredId(b.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => setSelected({ side: "right", block: b })}
            >
              <pre>{b.b.text}</pre>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SLIDE-UP SELECTION BAR */}
      <AnimatePresence>
        {selected && (
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
                onClick={() => handleAccept(selected.block, "left")}
              >
                Accept Left
              </button>
              <button
                className="accept-right"
                onClick={() => handleAccept(selected.block, "right")}
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
