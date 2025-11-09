import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Highlight, themes } from "prism-react-renderer";
import ShowError from '../utils/ShowError';
import { useNavigate } from "react-router-dom";



/* ---------- Mock utilities ---------- */
function initializeMergedState(originalA) {
  return {
    originalA,
    mergedText: originalA,
    choices: new Map(),
  };
}

function applyChoice(currentState, blocks, block, side) {
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

function computeMergedFromChoices(originalA, blocks, choices) {
  const ordered = [...blocks].sort((x, y) => x.a.start - y.a.start);

  let out = "";
  let cursor = 0;

  for (const b of ordered) {
    out += originalA.slice(cursor, b.a.start);

    const pick = choices.get(b.id);
    if (pick === "left") out += b.a.text;
    else if (pick === "right") out += b.b.text;
    else out += originalA.slice(b.a.start, b.a.end);

    cursor = b.a.end;
  }

  out += originalA.slice(cursor);
  return out;
}

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

function CodeBlock({ code, language, startLine = 1 }) {
  return (
    <Highlight code={code ?? ""} language={language} theme={themes.vsDark}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={{ ...style, background: "transparent", margin: 0 }}>
          {tokens.map((line, i) => {
            const displayLine = startLine + i;
            return (
              <div key={i} {...getLineProps({ line, key: i })}>
                <span
                  style={{
                    display: "inline-block",
                    width: "2.5em",
                    userSelect: "none",
                    opacity: 0.4,
                    textAlign: "right",
                    marginRight: "1em",
                    color: "#858585",
                  }}
                >
                  {displayLine}
                </span>
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
const focusLift = { z: 24, scale: 1.03, transition: { duration: 0.22 } };

/* ---------- main ---------- */
export default function MergePage() {
  const [errorMessage, setErrorMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  const navbarStyle = {
    height: '48px',
    background: '#2c2c2c',
    borderBottom: '1px solid #3a3a3a',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1.5rem',
    fontWeight: '600',
    color: '#9cdcfe',
    letterSpacing: '0.5px',
    fontSize: '1.1rem',
    position: 'relative',
    zIndex: 101,
  };

  const hamburgerStyle = {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginRight: '1rem',
  };

  const hamburgerLineStyle = {
    width: '24px',
    height: '3px',
    backgroundColor: '#9cdcfe',
    borderRadius: '2px',
    transition: 'all 0.3s ease',
  };

    const titleStyle = {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#9cdcfe',
  };

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: sidebarOpen ? 0 : '-400px',
    width: '300px',
    height: '100vh',
    backgroundColor: '#252526',
    borderRight: '1px solid #3a3a3a',
    transition: 'left 0.3s ease',
    zIndex: 100,
    padding: '80px 1.5rem 1.5rem',
    boxShadow: sidebarOpen ? '4px 0 12px rgba(0, 0, 0, 0.5)' : 'none',
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: sidebarOpen ? 'block' : 'none',
    zIndex: 99,
  };

  const sidebarLinkStyle = {
    display: 'block',
    padding: '12px 16px',
    color: '#dcdcdc',
    textDecoration: 'none',
    borderRadius: '6px',
    marginBottom: '8px',
    transition: 'background 0.2s ease',
    cursor: 'pointer',
  };
  
  useEffect(() => {
    const styleId = 'merge-engine-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .merge-root {
          background-color: #1e1e1e;
          color: #dcdcdc;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: "JetBrains Mono", "Consolas", monospace;
        }
        
        .merge-navbar {
          height: 48px;
          background: #2c2c2c;
          border-bottom: 1px solid #3a3a3a;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          font-weight: 600;
          color: #9cdcfe;
          letter-spacing: 0.5px;
        }
        
        .merge-container {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
          flex: 1;
          padding: 1rem;
          overflow: hidden;
        }
        
        .merge-pane, .merge-output {
          background: #252526;
          border: 1px solid #3a3a3a;
          border-radius: 8px;
          padding: 0.75rem;
          overflow-y: auto;
          transition: box-shadow 0.3s ease;
        }
        
        .merge-output {
          border: 1px dashed #555;
        }
        
        .chunk {
          position: relative;
          background: #2d2d2d;
          border-radius: 8px;
          padding: 0.6rem 0.75rem;
          margin-bottom: 0.9rem;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: pointer;
          border-left: 3px solid #3a3a3a;
        }
        
        .chunk:hover {
          background: #333333;
          border-left-color: #555;
        }
        
        .chunk.focused {
          box-shadow: 0 0 14px rgba(0, 150, 255, 0.35);
          transform: scale(1.03);
          border-left-color: #0aa2ff;
        }
        
        .choice-badge {
          position: absolute;
          top: 6px;
          right: 8px;
          font-size: 0.8rem;
          line-height: 1;
          font-weight: 700;
        }
        
        .choice-badge.check {
          color: #6aff6a;
        }
        
        .choice-badge.cross {
          color: #ff4d4d;
        }
        
        .selection-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          background: #2b2b2b;
          border-top: 1px solid #3a3a3a;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 0;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.4);
          z-index: 10;
        }
        
        .selection-bar p {
          color: #dcdcdc;
          margin: 0;
          font-size: 0.9rem;
        }
        
        .bar-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .accept-left, .accept-right {
          border: none;
          border-radius: 6px;
          padding: 0.4rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .accept-left {
          background-color: #007acc;
          color: #fff;
        }
        
        .accept-right {
          background-color: #89d185;
          color: #1e1e1e;
        }
        
        .accept-left:hover, .accept-right:hover {
          transform: scale(1.05);
        }
        
        .perspective {
          perspective: 1000px;
          transform-style: preserve-3d;
        }
        
        .decided-wrap {
          padding: 0.5rem 1rem 0;
        }
        
        .decided-toggle {
          background: #2c2c2c;
          color: #9cdcfe;
          border: 1px solid #3a3a3a;
          border-radius: 6px;
          padding: 0.35rem 0.6rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-family: "JetBrains Mono", "Consolas", monospace;
        }
        
        .decided-panel {
          margin-top: 0.5rem;
          background: #262626;
          border: 1px solid #3a3a3a;
          border-radius: 8px;
          padding: 0.5rem 0.6rem;
        }
        
        .decided-row {
          display: flex;
          gap: 0.6rem;
          align-items: baseline;
          border-bottom: 1px solid #333;
          padding: 0.4rem 0;
        }
        
        .decided-row:last-child {
          border-bottom: none;
        }
        
        .decided-tag {
          color: #89d185;
          font-size: 0.8rem;
          white-space: nowrap;
        }
        
        .decided-preview {
          color: #c8c8c8;
          font-size: 0.85rem;
          opacity: 0.9;
        }
        
        .fly-clone {
          pointer-events: none;
          filter: drop-shadow(0 10px 18px rgba(0,0,0,0.45));
        }
        
        .fly-clone .chunk.clone {
          border-left-color: #0aa2ff;
          background: #303030;
          box-shadow: 0 10px 24px rgba(0,0,0,0.45);
        }

        /* ---------- SAVE MERGE BUTTON (added) ---------- */
        .save-merge-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: 1rem 0 1.2rem;
          background: transparent;
          position: relative;
          z-index: 5;
          font-family: "JetBrains Mono", "Consolas", monospace;
        }

        .save-merge-btn {
          background: #2c2c2c;
          color: #0aa2ff;
          border: none;
          border-radius: 8px;
          padding: 0.6rem 1.2rem;
          font-family: "Inter", sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
          font-family: "JetBrains Mono", "Consolas", monospace;
          cursor: pointer;

          transition: all 0.2s ease-in-out;
        }

        .undo-btn {
          
          background: #262626;
          border: none;
          color: #0aa2ff;
          cursor:'pointer';

          font-family: "JetBrains Mono", "Consolas", monospace;

        }

        

        .save-merge-btn:hover {
          transform: scale(1.05);
          background: #2563eb;
        }

        .save-merge-btn:active {
          transform: scale(0.97);
          box-shadow: 0 2px 6px rgba(59,130,246,0.2);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

const fileAName = localStorage.getItem("fileAName") || "fileA";
const fileBName = localStorage.getItem("fileBName") || "fileB";

const contentA = localStorage.getItem("fileA") || "";
const contentB = localStorage.getItem("fileB") || "";
const initialBlocks = JSON.parse(localStorage.getItem("mergeBlocks") || "[]");


  const language = detectLanguage(fileAName || fileBName);

  const [engine, setEngine] = useState(() => initializeMergedState(contentA || ""));
  const [activeBlocks, setActiveBlocks] = useState(initialBlocks);
  const [decidedBlocks, setDecidedBlocks] = useState([]); // [{block, chosen}]
  const [decidedOpen, setDecidedOpen] = useState(true);
  const [focusedId, setFocusedId] = useState(null);
  const [barSelection, setBarSelection] = useState(null);
  const [fly, setFly] = useState(null);

  const mergePaneRef = useRef(null);
  const chunkRefsLeft = useRef(new Map());
  const chunkRefsRight = useRef(new Map());

// original index map so undo restores exact order
const originalIndexMap = useMemo(
  () => new Map(initialBlocks.map((b, i) => [b.id, i])),
  [initialBlocks]
);

  useEffect(() => {
    setEngine((prev) =>
      prev.originalA === (contentA || "")
        ? prev
        : initializeMergedState(contentA || "")
    );
  }, [contentA]);

  const onChunkClick = (side, block) => {
    setFocusedId(block.id);
    setBarSelection({ block });
  };

  const clearFocus = (e) => {
    if (e.target.closest?.(".selection-bar")) return;
    setFocusedId(null);
    setBarSelection(null);
  };

  const startLineFor = (b) => countLinesUntil(contentA || "", b.a.start);

  const handleAccept = (block, side) => {
    const sourceEl =
      (side === "left"
        ? chunkRefsLeft.current.get(block.id)
        : chunkRefsRight.current.get(block.id)) || null;
    const fromRect = sourceEl?.getBoundingClientRect?.();

    const mergeRect = mergePaneRef.current?.getBoundingClientRect?.();
    
    const toRect = mergeRect && {
      x: mergeRect.x + mergeRect.width * 0.15,
      y: mergeRect.y + mergeRect.height * 0.3,
      width: mergeRect.width * 0.7,
      height: 60,
    };

    setFly({
      id: block.id,
      side,
      fromRect,
      toRect,
      code: side === "left" ? block.a.text : block.b.text,
    });

    const next = applyChoice(engine, [...activeBlocks, ...decidedBlocks.map(d => d.block)], block, side);
    setEngine(next);

    setTimeout(() => {
      setDecidedBlocks((prev) => [...prev, { block, chosen: side }]);
      setActiveBlocks((prev) => prev.filter((x) => x.id !== block.id));
      setFly(null);
      setBarSelection(null);
      setFocusedId(null);
    }, 800);
  };

  const handleSaveMerge = async () => {
  try {
    const payload = {
      fileA: contentA,
      fileB: contentB,
      acceptedMerges: decidedBlocks.map(({ block, chosen }) => ({
        blockId: block.id,
        side: chosen,
      })),
    };

    const res = await fetch('https://www-student.cse.buffalo.edu/~holdenen/save_merge', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Save failed: ${res.statusText}`);
    }

    setErrorMessage("✅ Merge progress saved successfully!");
  } catch (err) {
    console.error("Error saving merge:", err);
    setErrorMessage("❌ Failed to save merge progress.");
  }
};


  function handleUndo(blockId) {
  // 1) pull the decided entry
  const decided = decidedBlocks.find((d) => d.block.id === blockId);
  if (!decided) return;

  // 2) remove from decided
  setDecidedBlocks((prev) => prev.filter((d) => d.block.id !== blockId));

  // 3) reinsert into active at original index
  setActiveBlocks((prev) => {
  const next = [...prev];
  const idx = originalIndexMap.get(blockId);

  // find correct insertion index based on surrounding blocks still in active list
  let insertAt = next.findIndex(b => {
    const bIdx = originalIndexMap.get(b.id);
    return bIdx > idx;
  });

  if (insertAt === -1) {
    insertAt = next.length; // append if it belongs at the end
  }

  next.splice(insertAt, 0, decided.block);
  return next;

  });

  // 4) remove the choice from engine + rebuild merged text
  setEngine((prev) => {
    const newChoices = new Map(prev.choices);
    newChoices.delete(blockId);
    return {
      ...prev,
      choices: newChoices,
      mergedText: computeMergedFromChoices(
        prev.originalA,
        initialBlocks, // keep deterministic original ordering
        newChoices
      ),
    };
  });
}


  const setLeftRef = (id) => (el) => {
    if (!el) chunkRefsLeft.current.delete(id);
    else chunkRefsLeft.current.set(id, el);
  };
  const setRightRef = (id) => (el) => {
    if (!el) chunkRefsRight.current.delete(id);
    else chunkRefsRight.current.set(id, el);
  };

  return (
    <div className="merge-root" onMouseDown={clearFocus}>
      {/* <header className="merge-navbar">FILE XOR</header> */}
      {/* Navbar */}
      <nav style={navbarStyle}>
        <div
          style={hamburgerStyle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <div style={hamburgerLineStyle}></div>
          <div style={hamburgerLineStyle}></div>
          <div style={hamburgerLineStyle}></div>
        </div>
        <span style={titleStyle}>file_xor</span>
      </nav>

      {/* Overlay */}
      <div style={overlayStyle} onClick={() => setSidebarOpen(false)}></div>

      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div
          style={sidebarLinkStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#2d2d2d')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          onClick={() => navigate('/')}
        >
          Home
        </div>
        {/* <div
          style={sidebarLinkStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#2d2d2d')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          onClick={() => window.location.href = '/history'}
        >
          Merge History
        </div> */}
        <div
          style={sidebarLinkStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#2d2d2d')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          onClick={() => navigate("/landing")}
        >
          Logout
        </div>
      </div>
      {errorMessage && (
                    <ShowError
                      message={errorMessage}
                      onClose={() => setErrorMessage('')}
                    />
            )}
      <div className="decided-wrap">
        <button
          className="decided-toggle"
          onClick={() => setDecidedOpen((s) => !s)}
        >
          {decidedOpen ? "▼" : "▶"} Merged Changes ({decidedBlocks.length})
        </button>

        <AnimatePresence initial={false}>
          {decidedOpen && decidedBlocks.length > 0 && (
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
                    {(chosen === "left" ? block.a.text : block.b.text).slice(0, 120)}
                    {((chosen === "left" ? block.a.text : block.b.text) || "").length > 120 && "…"}
                  </span>
                  <button className="undo-btn" onClick={() => handleUndo(block.id)}>
                    ⟳ Undo
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      
      <div className="merge-container perspective">
        <div className="merge-pane left-pane">
          <AnimatePresence mode="popLayout">
            {activeBlocks.map((b) => {
              const startLine = startLineFor(b);
              const choice = engine.choices.get(b.id);
              return (
                <motion.div
                  key={b.id + "-left"}
                  ref={setLeftRef(b.id)}
                  className={`chunk ${focusedId === b.id ? "focused" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChunkClick("left", b);
                  }}
                  layout
                  animate={focusedId === b.id ? "focus" : "rest"}
                  variants={{ focus: focusLift, rest: { scale: 1, boxShadow: "none" } }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                >
                  <CodeBlock code={b.a.text} language={language} startLine={startLine} />
                  {choice && (
                    <div className={`choice-badge ${choice === "left" ? "check" : "cross"}`}>
                      {choice === "left" ? "✔" : "❌"}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <motion.div layout ref={mergePaneRef} className="merge-output">
          <CodeBlock code={engine.mergedText} language={language} startLine={1} />
        </motion.div>

        <div className="merge-pane right-pane">
          <AnimatePresence mode="popLayout">
            {activeBlocks.map((b) => {
              const startLine = startLineFor(b);
              const choice = engine.choices.get(b.id);
              return (
                <motion.div
                  key={b.id + "-right"}
                  ref={setRightRef(b.id)}
                  className={`chunk ${focusedId === b.id ? "focused" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChunkClick("right", b);
                  }}
                  layout
                  animate={focusedId === b.id ? "focus" : "rest"}
                  variants={{ focus: focusLift, rest: { scale: 1, boxShadow: "none" } }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                >
                  <CodeBlock code={b.b.text} language={language} startLine={startLine} />
                  {choice && (
                    <div className={`choice-badge ${choice === "right" ? "check" : "cross"}`}>
                      {choice === "right" ? "✔" : "❌"}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

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
              initial={{ scale: 1, opacity: 1, rotateY: 0, y: 0, x: 0 }}
              animate={{
                scale: [1, 1.15, 1.1],
                y: [0, -40, fly.toRect.y - fly.fromRect.y],
                x: [0, 0, fly.toRect.x - fly.fromRect.x],
                rotateY: [0, 8, 0],
                opacity: [1, 1, 0.95],
                transition: { 
                  duration: 0.7,
                  times: [0, 0.4, 1],
                  ease: [0.34, 1.56, 0.64, 1]
                },
              }}
              exit={{ scale: 1, opacity: 0, transition: { duration: 0.2 } }}
            >
              <div className="chunk clone">
                <CodeBlock code={fly.code} language={language} startLine={1} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Added: centered save button under the middle panel */}
      <div className="save-merge-container">
        <button className="save-merge-btn" onClick={handleSaveMerge}>
          Save Merge Progress
        </button>
      </div>

      <AnimatePresence>
        {barSelection && (
          <motion.div
            className="selection-bar"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
