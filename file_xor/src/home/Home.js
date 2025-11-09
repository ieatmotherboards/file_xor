import React, { useState, useEffect } from "react";
import { diff_match_patch } from "diff-match-patch";

export default function Home() {
  const [fileNames, setFileNames] = useState(["", ""]);
  const [fileTextPreview, setFileTextPreview] = useState(["", ""]);
  const [fullDiffLines, setFullDiffLines] = useState([]); // Full diff
  const [diffLines, setDiffLines] = useState([]); // Animated diff
  const [darkMode, setDarkMode] = useState(false);

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

    if (newPreviews[0] && newPreviews[1]) {
      const lines1 = newPreviews[0].split("\n");
      const lines2 = newPreviews[1].split("\n");
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
              <span key={idx} style={{ backgroundColor: "#d1fae5" }}>
                {data}
              </span>
            );
          if (op === 0) return <span key={idx}>{data}</span>;
          return null;
        });

        const renderFile2 = diffs.map(([op, data], idx) => {
          if (op === 1)
            return (
              <span key={idx} style={{ backgroundColor: "#fee2e2" }}>
                {data}
              </span>
            );
          if (op === 0) return <span key={idx}>{data}</span>;
          return null;
        });

        lineDiffs.push({ line: i + 1, file1: renderFile1, file2: renderFile2 });
      }

      setFullDiffLines(lineDiffs);
    }
  };

  // Animate diff lines one by one safely
  useEffect(() => {
  setDiffLines([]); // Reset animation
  if (fullDiffLines.length === 0) return;

    fullDiffLines.forEach((line, idx) => {
      setTimeout(() => {
        setDiffLines(prev => [...prev, line]);
      }, 300 * idx); // 300ms per line
    });
  }, [fullDiffLines]);

  const fileLabel = idx => fileNames[idx] || `File ${idx + 1}`;
  const filePreviewTitle = idx => `${fileNames[idx] || `File ${idx + 1}`} Preview`;

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <div style={theme.page}>
      {/* Centered header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <h1 style={theme.title}>File XOR</h1>
        <button style={theme.toggleButton} onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <p style={theme.subtitle}>
        Compare two files instantly with a simple, friendly interface.
      </p>

      {/* XOR Icons */}
      <div style={{ display: "flex", gap: "20px" }}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/55/55025.png"
          alt="XOR Icon 1"
          style={{ width: "40px", height: "40px", borderRadius: "8px" }}
        />
        <img
          src="https://images.freeimages.com/clg/images/37/370032/logic-xor-symbol-clip-art_f.jpg"
          alt="XOR Icon 2"
          style={{ width: "40px", height: "40px", borderRadius: "8px" }}
        />
        <img
          src="https://cdn-icons-png.flaticon.com/512/55/55025.png"
          alt="XOR Icon 3"
          style={{ width: "40px", height: "40px", borderRadius: "8px" }}
        />
      </div>

      {/* Upload Section */}
      <div style={theme.uploadContainer}>
        {["File 1", "File 2"].map((label, idx) => (
          <div key={idx} style={theme.uploadSection}>
            <label htmlFor={`file${idx}`} style={theme.uploadLabel} className="upload-button">
              Upload {label}
            </label>
            <input
              id={`file${idx}`}
              type="file"
              accept=".txt,.py,.js,.html,.css,.json"
              style={theme.fileInput}
              onChange={e => handleFileUpload(e, idx)}
            />
            <div style={theme.fileName}>{fileNames[idx] || <em>No file chosen</em>}</div>
          </div>
        ))}
      </div>

      {/* File Previews */}
      {fileTextPreview[0] && fileTextPreview[1] && (
        <div style={theme.previewContainer}>
          {fileTextPreview.map((text, idx) => (
            <div key={idx} style={theme.previewSection}>
              <h4 style={theme.previewTitle}>{filePreviewTitle(idx)}</h4>
              <pre style={theme.previewBox}>{text}</pre>
            </div>
          ))}
        </div>
      )}

      {/* Diff Table */}
      <div style={theme.diffTableContainer}>
        <table style={theme.diffTable}>
          <thead>
            <tr>
              <th>Line</th>
              <th>{fileLabel(0)}</th>
              <th>{fileLabel(1)}</th>
            </tr>
          </thead>
          <tbody>
            {diffLines.map(line => (
              <tr key={line.line}>
                <td style={theme.lineNumber}>{line.line}</td>
                <td style={theme.diffCell}>{line.file1}</td>
                <td style={theme.diffCell}>{line.file2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>
        {`
          .upload-button {
            transition: all 0.2s ease-in-out;
          }
          .upload-button:hover {
            transform: scale(1.08);
            box-shadow: 0 8px 16px rgba(59,130,246,0.3);
          }
          .upload-button:active {
            transform: scale(0.97);
            box-shadow: 0 4px 8px rgba(59,130,246,0.2);
          }
        `}
      </style>
    </div>
  );
}

/* ---------- LIGHT THEME ---------- */
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
  diffTableContainer: { maxWidth: "900px", width: "100%", overflowX: "auto" },
  diffTable: { width: "100%", borderCollapse: "collapse" },
  lineNumber: {
    width: "40px",
    fontWeight: 600,
    background: "#f3f4f6",
  },
  diffCell: { whiteSpace: "pre-wrap" },
};

/* ---------- DARK THEME ---------- */
const darkTheme = {
  ...lightTheme,
  page: {
    ...lightTheme.page,
    background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    color: "#f9fafb",
  },
  uploadSection: { ...lightTheme.uploadSection, background: "#1f2937" },
  uploadLabel: { ...lightTheme.uploadLabel, background: "#2563eb" },
  previewBox: {
    ...lightTheme.previewBox,
    background: "#111827",
    border: "1px solid #374151",
    color: "#f9fafb",
  },
  lineNumber: { ...lightTheme.lineNumber, background: "#374151", color: "#f9fafb" },
};
