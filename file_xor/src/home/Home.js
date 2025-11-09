import React, { useState, useEffect, useRef } from "react";
import { diff_match_patch } from "diff-match-patch";

export default function Home() {
  const [fileNames, setFileNames] = useState(["", ""]);
  const [fileTextPreview, setFileTextPreview] = useState(["", ""]);
  const [fullDiffLines, setFullDiffLines] = useState([]);
  const [diffLines, setDiffLines] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const [showDiffButton, setShowDiffButton] = useState(false); // NEW
  const diffContainerRef = useRef(null);

  const timeoutsRef = useRef([]);
  const mergeTimerRef = useRef(null);

  const clearPendingLineTimeouts = () => {
    if (timeoutsRef.current.length) {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    }
  };

  const resetAnimationState = () => {
    clearPendingLineTimeouts();
    setDiffLines([]);
  };

  const handleFileUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const newNames = [...fileNames];
    newNames[index] = file.name;
    setFileNames(newNames);

    const text = await file.text();
    const newPreviews = [...fileTextPreview];
    newPreviews[index] = text;
    setFileTextPreview(newPreviews);

    // Show "View Differences!" button when both files are uploaded
    if (newPreviews[0] && newPreviews[1]) {
      setShowDiffButton(true);
      setFullDiffLines([]);
      resetAnimationState();
    }
  };

  const handleViewDifferences = () => {
    setShowDiffButton(false);
    resetAnimationState();
    setFullDiffLines([]);

    const lines1 = fileTextPreview[0].split("\n");
    const lines2 = fileTextPreview[1].split("\n");
    const maxLines = Math.max(lines1.length, lines2.length);

    const dmp = new diff_match_patch();
    const lineDiffs = [];

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] ?? "";
      const line2 = lines2[i] ?? "";
      const diffs = dmp.diff_main(line1, line2);
      dmp.diff_cleanupSemantic(diffs);

      const renderFile1 = diffs.map(([op, data], idx) => {
        if (op === -1)
          return (
            <span key={idx} style={theme.diffAdded}>
              {data}
            </span>
          );
        if (op === 0) return <span key={idx}>{data}</span>;
        return null;
      });

      const renderFile2 = diffs.map(([op, data], idx) => {
        if (op === 1)
          return (
            <span key={idx} style={theme.diffRemoved}>
              {data}
            </span>
          );
        if (op === 0) return <span key={idx}>{data}</span>;
        return null;
      });

      lineDiffs.push({ line: i + 1, file1: renderFile1, file2: renderFile2 });
    }

    setFullDiffLines(lineDiffs);
  };

  useEffect(() => {
    clearPendingLineTimeouts();
    setDiffLines([]);

    if (!fullDiffLines || fullDiffLines.length === 0) return;

    fullDiffLines.forEach((line, idx) => {
      const id = setTimeout(() => {
        setDiffLines((prev) => [...prev, line]);
      }, idx * 300);
      timeoutsRef.current.push(id);
    });

    return () => {
      clearPendingLineTimeouts();
    };
  }, [fullDiffLines]);

  useEffect(() => {
    mergeTimerRef.current = setTimeout(() => setAnimationDone(true), 3000);
    return () => {
      if (mergeTimerRef.current) clearTimeout(mergeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Scroll the page to bottom smoothly when a new line is added
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, [diffLines]);

  const fileLabel = (idx) => fileNames[idx] || `File ${idx + 1}`;
  const filePreviewTitle = (idx) => `${fileNames[idx] || `File ${idx + 1}`} Preview`;

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <div style={theme.page}>
      {/* Centered header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <h1 style={theme.title}>FILE_XOR</h1>
        <button style={theme.toggleButton} className="upload-button bounce-in" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <p style={theme.subtitle}>Compare two files instantly with a simple, friendly interface.</p>

      {/* XOR Animation */}
      <div className="xor-animation">
        <img
          src="https://cdn-icons-png.flaticon.com/512/55/55025.png"
          alt="File Left"
          className={`file-icon left ${animationDone ? "merged" : ""}`}
        />
        <img
          src="https://images.freeimages.com/clg/images/37/370032/logic-xor-symbol-clip-art_f.jpg"
          alt="XOR Logo"
          className={`xor-logo ${animationDone ? "merged" : ""}`}
        />
        <img
          src="https://cdn-icons-png.flaticon.com/512/55/55025.png"
          alt="File Right"
          className={`file-icon right ${animationDone ? "merged" : ""}`}
        />
      </div>

      {/* Upload Section */}
      <div style={theme.uploadContainer}>
        {["File 1", "File 2"].map((label, idx) => (
          <div key={idx} style={theme.uploadSection}>
            <label htmlFor={`file${idx}`} style={theme.uploadLabel} className="upload-button">
              Upload {label}
            </label>
            <input id={`file${idx}`} type="file" accept=".txt,.py,.js,.html,.css,.json" style={theme.fileInput} onChange={(e) => handleFileUpload(e, idx)} />
            <div style={theme.fileName}>{fileNames[idx] || <em>No file chosen</em>}</div>
          </div>
        ))}
      </div>

      {/* File Previews */}
      {(fileTextPreview[0] || fileTextPreview[1]) && (
        <div style={theme.previewContainer}>
          {fileTextPreview.map((text, idx) => (
            <div key={idx} style={theme.previewSection}>
              <h4 style={theme.previewTitle}>{filePreviewTitle(idx)}</h4>
              <pre style={theme.previewBox}>{text}</pre>
            </div>
          ))}
        </div>
      )}

      {/* View Differences Button (Animated) */}
      {showDiffButton && (
        <button
          className="view-diff-button bounce-in"
          style={{
            ...theme.uploadLabel,
            fontSize: "1.1rem",
            marginBottom: "20px",
            cursor: "pointer",
          }}
          onClick={handleViewDifferences}
        >
          🔍 View Differences!
        </button>
      )}

      {/* Diff Table */}
      <div style={theme.diffTableContainer} ref={diffContainerRef}>
        <table style={theme.diffTable} className="diff-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>{fileLabel(0)}</th>
              <th>{fileLabel(1)}</th>
            </tr>
          </thead>
          <tbody>
            {diffLines.map((line) => (
              <tr key={line.line}>
                <td style={theme.lineNumber}>{line.line}</td>
                <td style={theme.diffCell}>{line.file1}</td>
                <td style={theme.diffCell}>{line.file2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Merge Button */}
      {diffLines.length > 0 && diffLines.length === fullDiffLines.length && (
        <button
          className="upload-button bounce-in"
          style={{
            ...theme.uploadLabel,
            marginTop: "30px",
            fontSize: "1.1rem",
            cursor: "pointer",
          }}
          onClick={() => console.log("Merge clicked!")}
        >
          🚀 Merge!
        </button>
      )}

      <style>
        {`
          /* Reuse upload-button hover styles */
          .upload-button {
            transition: all 0.2s ease-in-out;
          }
          .upload-button:hover {
            transform: scale(1.08);
            box-shadow: 0 8px 16px rgba(59,130,246,0.3);
          }

          /* Bounce-In Animation for View Differences! */
          .bounce-in {
            animation: bounceIn 0.6s ease-in-out;
          }
          @keyframes bounceIn {
            0% { transform: scale(0.6); opacity: 0; }
            60% { transform: scale(1.2); opacity: 1; }
            80% { transform: scale(0.95); }
            100% { transform: scale(1); }
          }

          /* XOR Animation */
          .xor-animation {
            position: relative;
            height: 80px;
            width: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
          }
          .file-icon {
            position: absolute;
            width: 50px;
            height: 50px;
            top: 0;
            transition: transform 2s ease-in-out, opacity 0.6s ease-in-out;
          }
          .file-icon.left {
            left: 0;
            transform: translateX(-200px);
            animation: slideInLeft 2s forwards;
          }
          .file-icon.right {
            right: 0;
            transform: translateX(200px);
            animation: slideInRight 2s forwards;
          }
          .xor-logo {
            position: absolute;
            width: 60px;
            height: 60px;
            opacity: 0;
            animation: fadeInXor 2s 1s forwards, pulseMerge 0.6s 2.8s ease-in-out;
          }
          .merged { opacity: 0; }

          .toggle-button {
            animation-delay: 0.3s; /* optional delay */
          }

          .diff-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: auto; /* let the browser calculate widths */
            }

            .diff-table th,
            .diff-table td {
            padding: 8px;
            vertical-align: top;
            }

            .diff-table th:first-child,
            .diff-table td:first-child {
            width: 50px; /* fixed width for line numbers */
            }

            .diff-table th:nth-child(2),
            .diff-table td:nth-child(2),
            .diff-table th:nth-child(3),
            .diff-table td:nth-child(3) {
            width: calc((100% - 50px) / 2); /* split remaining width evenly */
            word-break: break-word;          /* wrap long lines */
            }

          @keyframes slideInLeft {
            0% { transform: translateX(-200px); opacity: 0; }
            60% { opacity: 1; }
            100% { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInRight {
            0% { transform: translateX(200px); opacity: 0; }
            60% { opacity: 1; }
            100% { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeInXor {
            0% { opacity: 0; transform: scale(0.7); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes pulseMerge {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}

/* ---------- THEMES ---------- */
const lightTheme = {
  page: {
    fontFamily: "'Inter', sans-serif",
    padding: "40px 20px",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
    color: "#111827",
  },
  title: { fontSize: "2.2rem", fontWeight: 600, marginBottom: "10px" },
  subtitle: { marginBottom: "40px", color: "#64748b" },
  toggleButton: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 500,
  },
  uploadContainer: {
    display: "flex",
    maxWidth: "900px",
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },
  uploadSection: {
    flex: "1 1 300px",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#ffffff",
  },
  uploadLabel: {
    background: "#3b82f6",
    color: "white",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
    userSelect: "none",
    display: "inline-block",
  },
  fileInput: { display: "none" },
  fileName: { marginTop: "15px", color: "#374151" },
  previewContainer: {
    display: "flex",
    maxWidth: "900px",
    width: "100%",
    gap: "20px",
    marginBottom: "20px",
  },
  previewSection: { flex: "1 1 300px" },
  previewTitle: { marginBottom: "10px", textAlign: "center" },
  previewBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    padding: "15px",
    borderRadius: "8px",
    maxHeight: "300px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
  },
  diffTableContainer: { 
    maxWidth: "900px", 
    width: "100%", 
    maxHeight: "400px",      // limit height so vertical scrolling works
    overflowY: "auto",       // enable vertical scrolling
    overflowX: "auto",       // keep horizontal scrolling
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "10px",
    background: "#f9fafb"
  },
};

const darkTheme = {
  ...lightTheme,
  page: {
    ...lightTheme.page,
    background: "linear-gradient(135deg, #121212 0%, #1e1e2f 100%)", // darker gradient for contrast
    color: "#e0e0e0", // softer white for text
  },
  uploadSection: { ...lightTheme.uploadSection, background: "#1e1e2f" },
  uploadLabel: { ...lightTheme.uploadLabel, background: "#3b82f6", color: "#ffffff" },
  previewBox: {
    ...lightTheme.previewBox,
    background: "#1b1b2a", // slightly darker preview box
    border: "1px solid #33334d",
    color: "#e0e0e0",
  },
  diffTableContainer: {
    ...lightTheme.diffTableContainer,
    background: "#1b1b2a",
    border: "1px solid #33334d",
  },
  lineNumber: {
    background: "#2a2a3d",
    color: "#c0c0c0",
  },
  diffCell: {
    background: "#1b1b2a",
    color: "#e0e0e0",
  },
  diffAdded: { backgroundColor: "#064e3b", color: "#a7f3d0" }, // green for removed lines
  diffRemoved: { backgroundColor: "#581c1c", color: "#fecaca" }, // red for added lines
};