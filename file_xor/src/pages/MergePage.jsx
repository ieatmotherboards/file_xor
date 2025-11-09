import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const lines = (code ?? "").split("\n");
  
  const highlightPython = (line) => {
    const keywords = /\b(def|class|import|from|if|elif|else|for|while|return|try|except|raise|with|as|pass|break|continue|yield|lambda|and|or|not|in|is|None|True|False)\b/g;
    const strings = /(["'`])((?:\\.|(?!\1).)*?)\1/g;
    const comments = /(#.*$)/g;
    const functions = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
    const numbers = /\b(\d+\.?\d*)\b/g;
    
    let highlighted = line;
    highlighted = highlighted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    highlighted = highlighted.replace(comments, '<span style="color: #6A9955;">$1</span>');
    highlighted = highlighted.replace(strings, '<span style="color: #CE9178;">$&</span>');
    highlighted = highlighted.replace(keywords, '<span style="color: #569CD6;">$&</span>');
    highlighted = highlighted.replace(functions, '<span style="color: #DCDCAA;">$1</span>');
    highlighted = highlighted.replace(numbers, '<span style="color: #B5CEA8;">$1</span>');
    
    return highlighted;
  };
  
  const highlightJavaScript = (line) => {
    const keywords = /\b(function|const|let|var|if|else|for|while|return|try|catch|throw|new|this|class|extends|import|export|from|async|await|break|continue|switch|case|default)\b/g;
    const strings = /(["'`])((?:\\.|(?!\1).)*?)\1/g;
    const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/g;
    const functions = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
    const numbers = /\b(\d+\.?\d*)\b/g;
    
    let highlighted = line;
    highlighted = highlighted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    highlighted = highlighted.replace(comments, '<span style="color: #6A9955;">$1</span>');
    highlighted = highlighted.replace(strings, '<span style="color: #CE9178;">$&</span>');
    highlighted = highlighted.replace(keywords, '<span style="color: #569CD6;">$&</span>');
    highlighted = highlighted.replace(functions, '<span style="color: #DCDCAA;">$1</span>');
    highlighted = highlighted.replace(numbers, '<span style="color: #B5CEA8;">$1</span>');
    
    return highlighted;
  };
  
  const highlightLine = (line) => {
    if (language === 'python') {
      return highlightPython(line);
    } else if (language === 'javascript' || language === 'typescript') {
      return highlightJavaScript(line);
    }
    return line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  
  return (
    <pre style={{ 
      background: "transparent", 
      margin: 0,
      fontSize: "0.85rem",
      lineHeight: 1.5,
      fontFamily: "monospace"
    }}>
      {lines.map((line, i) => {
        const displayLine = startLine + i;
        const highlightedLine = highlightLine(line);
        
        return (
          <div key={i} style={{ display: "flex" }}>
            <span style={{
              display: "inline-block",
              width: "2.5em",
              userSelect: "none",
              opacity: 0.4,
              textAlign: "right",
              marginRight: "1em",
              color: "#858585",
              flexShrink: 0
            }}>
              {displayLine}
            </span>
            <span 
              style={{
                display: "inline-block",
                color: "#dcdcdc",
                whiteSpace: "pre",
                flex: 1
              }}
              dangerouslySetInnerHTML={{ __html: highlightedLine || " " }}
            />
          </div>
        );
      })}
    </pre>
  );
}

/* ---------- animation presets ---------- */
const focusLift = { 
  scale: 1.05, 
  boxShadow: "0 8px 24px rgba(10, 162, 255, 0.4)",
  transition: { duration: 0.3, ease: "easeOut" } 
};

/* ---------- main ---------- */
export default function MergePage() {
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
          color: #dcdcdc;
          border: 1px solid #3a3a3a;
          border-radius: 6px;
          padding: 0.35rem 0.6rem;
          cursor: pointer;
          font-size: 0.9rem;
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
      `;
      document.head.appendChild(style);
    }
  }, []);

  const fileAName = "fileA.py";
  const fileBName = "fileB.py";
  const contentA = `# fileA.py - Base version

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
`;

  const contentB = `# fileB.py - Modified version

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
`;

  const initialBlocks = [
    {
      id: "greet-func",
      a: { start: 28, end: 66, text: `def greet(name):\n    print(f"Hello, {name}!")` },
      b: { start: 28, end: 104, text: `def greet(name, excited=False):\n    message = f"Hello, {name}"\n    if excited:\n        message += "!!!"\n    print(message)` },
    },
    {
      id: "add-func",
      a: { start: 68, end: 96, text: `def add(a, b):\n    return a + b` },
      b: { start: 106, end: 245, text: `def add(a, b):\n    # Added type checking\n    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):\n        raise TypeError("add() arguments must be numbers")\n    return a + b` },
    },
    {
      id: "divide-func",
      a: { start: 120, end: 194, text: `def divide(a, b):\n    if b == 0:\n        print("Cannot divide by zero!")\n        return None\n    return a / b` },
      b: { start: 269, end: 353, text: `def divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        print("Error: divide by zero")\n        return None` },
    },
    {
      id: "factorial-func",
      a: { start: 196, end: 283, text: `def factorial(n):\n    if n == 0:\n        return 1\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    return result` },
      b: { start: 355, end: 466, text: `def factorial(n):\n    if n < 0:\n        raise ValueError("n must be non-negative")\n    if n == 0:\n        return 1\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    return result` },
    },
    {
      id: "summarize-func",
      a: { start: 285, end: 372, text: `def summarize(values):\n    total = sum(values)\n    avg = total / len(values)\n    print(f"Sum: {total}, Average: {avg}")` },
      b: { start: 468, end: 555, text: `def summarize(values):\n    total = sum(values)\n    avg = total / len(values)\n    print(f"Total={total}, Mean={avg}")` },
    },
  ];

  const language = detectLanguage(fileAName || fileBName);

  const [engine, setEngine] = useState(() => initializeMergedState(contentA || ""));
  const [activeBlocks, setActiveBlocks] = useState(initialBlocks);
  const [decidedBlocks, setDecidedBlocks] = useState([]);
  const [decidedOpen, setDecidedOpen] = useState(true);
  const [focusedId, setFocusedId] = useState(null);
  const [barSelection, setBarSelection] = useState(null);
  const [fly, setFly] = useState(null);

  const mergePaneRef = useRef(null);
  const chunkRefsLeft = useRef(new Map());
  const chunkRefsRight = useRef(new Map());

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
      <header className="merge-navbar">FILE XOR</header>

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