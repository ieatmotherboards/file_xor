// src/pages/MergePage.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  applyBlockLeft,
  applyBlockRight,
  initializeMergedState,
} from "../utils/MergeEngine";
import "../styles/MergeEngine.css";

export default function MergePage({ fileA = "", fileB = "", blocks = [] }) {
  const [state, setState] = useState(initializeMergedState(fileA));
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
    <div className="merge-container">
      {/* Left File */}
      <div className={`merge-pane ${selected === "left" ? "focused" : ""}`}>
        {blocks.map((b) => (
          <motion.div
            layout
            key={b.id + "-a"}
            className={`code-block ${
              state.appliedBlocks.has(b.id) ? "accepted" : ""
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected({ side: "left", block: b })}
          >
            <pre>{b.a.text}</pre>
          </motion.div>
        ))}
      </div>

      {/* Center Merged Output */}
      <motion.div
        layout
        className={`merge-output ${selected ? "blur-bg" : ""}`}
        transition={{ duration: 0.3 }}
      >
        <pre>{state.mergedText}</pre>
      </motion.div>

      {/* Right File */}
      <div className={`merge-pane ${selected === "right" ? "focused" : ""}`}>
        {blocks.map((b) => (
          <motion.div
            layout
            key={b.id + "-b"}
            className={`code-block ${
              state.appliedBlocks.has(b.id) ? "accepted" : ""
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected({ side: "right", block: b })}
          >
            <pre>{b.b.text}</pre>
          </motion.div>
        ))}
      </div>

      {/* Focus overlay when selecting a block */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="popup"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Choose which version to keep:</h3>
              <div className="popup-buttons">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
