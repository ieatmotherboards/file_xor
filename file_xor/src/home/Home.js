import React, { useState } from "react";
import { diff_match_patch } from "diff-match-patch";

export default function Home() {
  const [fileNames, setFileNames] = useState(["", ""]);
  const [fileTextPreview, setFileTextPreview] = useState(["", ""]);
  const [diffLines, setDiffLines] = useState([]);

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

    // Only compare when both files are loaded
    if (newPreviews[0] && newPreviews[1]) {
      const lines1 = newPreviews[0].split("\n");
      const lines2 = newPreviews[1].split("\n");
      const maxLines = Math.max(lines1.length, lines2.length);

      const dmp = new diff_match_patch();
      const lineDiffs = [];

      for (let i = 0; i < maxLines; i++) {
        const line1 = lines1[i] ?? "";
        const line2 = lines2[i] ?? "";

        // Compare word by word instead of by full line
        const diffs = dmp.diff_main(line1, line2);
        dmp.diff_cleanupSemantic(diffs);

        const renderFile1 = diffs.map(([op, data], idx) => {
          if (op === -1)
            return (
              <span key={idx} style={{ backgroundColor: "#d1fae5" }}>
                {data}
              </span>
            ); // removed (green)
          if (op === 0)
            return (
              <span key={idx} style={{ backgroundColor: "transparent" }}>
                {data}
              </span>
            ); // unchanged
          return null; // skip additions for file1
        });

        const renderFile2 = diffs.map(([op, data], idx) => {
          if (op === 1)
            return (
              <span key={idx} style={{ backgroundColor: "#fee2e2" }}>
                {data}
              </span>
            ); // added (red)
          if (op === 0)
            return (
              <span key={idx} style={{ backgroundColor: "transparent" }}>
                {data}
              </span>
            ); // unchanged
          return null; // skip deletions for file2
        });

        lineDiffs.push({
          line: i + 1,
          file1: renderFile1,
          file2: renderFile2,
        });
      }

      setDiffLines(lineDiffs);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>File XOR</h1>
      <p style={styles.subtitle}>
        Compare two files instantly with a simple, friendly interface.
      </p>

      {/* Upload Section */}
      <div style={styles.uploadContainer}>
        {["File 1", "File 2"].map((label, idx) => (
          <div key={idx} style={styles.uploadSection}>
            <label htmlFor={`file${idx}`} style={styles.uploadLabel}>
              Upload {label}
            </label>
            <input
              id={`file${idx}`}
              type="file"
              accept=".txt,.py,.js,.html,.css,.json"
              style={styles.fileInput}
              onChange={(e) => handleFileUpload(e, idx)}
            />
            <div style={styles.fileName}>{fileNames[idx]}</div>
          </div>
        ))}
      </div>

      {/* Original File Previews */}
      {fileTextPreview[0] && fileTextPreview[1] && (
        <div style={styles.previewContainer}>
          {fileTextPreview.map((text, idx) => (
            <div key={idx} style={styles.previewSection}>
              <h4 style={styles.previewTitle}>File {idx + 1} Preview</h4>
              <pre style={styles.previewBox}>{text}</pre>
            </div>
          ))}
        </div>
      )}

      {/* Line-by-Line Diff */}
      <div style={styles.diffTableContainer}>
        <table style={styles.diffTable}>
          <thead>
            <tr>
              <th>Line</th>
              <th>File 1</th>
              <th>File 2</th>
            </tr>
          </thead>
          <tbody>
            {diffLines.map((line) => (
              <tr key={line.line}>
                <td style={styles.lineNumber}>{line.line}</td>
                <td style={styles.diffCell}>{line.file1}</td>
                <td style={styles.diffCell}>{line.file2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Inter', sans-serif",
    padding: "40px 20px",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
  },
  title: { fontSize: "2.2rem", fontWeight: 600, marginBottom: "10px", textAlign: "center" },
  subtitle: { marginBottom: "40px", textAlign: "center", color: "#64748b" },
  uploadContainer: {
    display: "flex",
    maxWidth: "900px",
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },
  uploadSection: { flex: "1 1 300px", padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", background: "#ffffff" },
  uploadLabel: { background: "#3b82f6", color: "white", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: 500 },
  fileInput: { display: "none" },
  fileName: { marginTop: "15px", fontSize: "0.95rem", color: "#374151", textAlign: "center" },
  previewContainer: { display: "flex", maxWidth: "900px", width: "100%", gap: "20px", marginBottom: "20px" },
  previewSection: { flex: "1 1 300px", display: "flex", flexDirection: "column" },
  previewTitle: { marginBottom: "10px", fontSize: "1rem", textAlign: "center" },
  previewBox: { background: "#f3f4f6", padding: "15px", borderRadius: "8px", overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: "300px" },
  diffTableContainer: { maxWidth: "900px", width: "100%", overflowX: "auto" },
  diffTable: { width: "100%", borderCollapse: "collapse", textAlign: "center" },
  lineNumber: { width: "40px", textAlign: "center", fontWeight: 600, background: "#f3f4f6" },
  diffCell: { textAlign: "center", whiteSpace: "pre-wrap" },
};
