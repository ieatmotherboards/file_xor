import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./ShowError.css";

/**
 * ShowError - Themed replacement for native alert()
 * 
 * Props:
 *  - message (string): text to display
 *  - onClose (function): callback when the alert is dismissed
 */
export default function ShowError({ message, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="error-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="error-box"
            initial={{ scale: 0.9, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
          >
            <h3>⚠ Error</h3>
            <p>{message}</p>
            <button onClick={onClose}>OK</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}