import React, { useState } from "react";

export default function Home() {
  const [fileNames, setFileNames] = useState(["", ""]);
  const [fileContents, setFileContents] = useState(["", ""]);
  const [diffHTML, setDiffHTML] = useState("Upload two files to see the difference...");

  const handleFileUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const newNames = [...fileNames];
    const newContents = [...fileContents];
    newNames[index] = file.name;
    newContents[index] = text;

    setFileNames(newNames);
    setFileContents(newContents);

    // When both files are ready, call backend
    if (newContents[0] && newContents[1]) {
      const res = await fetch("http://localhost:5000/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file1: newContents[0], file2: newContents[1] }),
      });
      const data = await res.json();
      setDiffHTML(data.diff_html);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>LiveDiff</h1>
      <p style={styles.subtitle}>Compare two files instantly with a simple, friendly interface.</p>

      <div style={styles.uploadContainer}>
        {/* Upload Section 1 */}
        <div
          style={styles.uploadSection}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          <label htmlFor="file1" style={styles.uploadLabel}>
            Upload File 1
          </label>
          <input
            id="file1"
            type="file"
            accept=".txt,.py,.js,.html,.css,.json"
            style={styles.fileInput}
            onChange={(e) => handleFileUpload(e, 0)}
          />
          <div style={styles.fileName}>{fileNames[0]}</div>
        </div>

        {/* Divider */}
        <div style={styles.divider}></div>

        {/* Upload Section 2 */}
        <div
          style={styles.uploadSection}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          <label htmlFor="file2" style={styles.uploadLabel}>
            Upload File 2
          </label>
          <input
            id="file2"
            type="file"
            accept=".txt,.py,.js,.html,.css,.json"
            style={styles.fileInput}
            onChange={(e) => handleFileUpload(e, 1)}
          />
          <div style={styles.fileName}>{fileNames[1]}</div>
        </div>
      </div>

      <div
        id="diff-output"
        style={styles.diffOutput}
        dangerouslySetInnerHTML={{ __html: diffHTML }}
      />
    </div>
  );
}

//Inline Styling (JS Object Style)
const styles = {
  page: {
    fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
    color: "#333",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: "100vh",
    padding: "40px 20px",
    transition: "all 0.3s ease-in-out",
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: "40px",
    fontSize: "1rem",
  },
  uploadContainer: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "stretch",
    justifyContent: "center",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
    maxWidth: "900px",
    width: "100%",
    transition: "box-shadow 0.3s ease",
  },
  uploadSection: {
    flex: "1 1 300px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    background: "#ffffff",
    transition: "background 0.3s ease, transform 0.2s ease",
  },
  uploadLabel: {
    background: "#3b82f6",
    color: "white",
    padding: "12px 24px",
    borderRadius: "8px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  fileInput: {
    display: "none",
  },
  fileName: {
    marginTop: "15px",
    fontSize: "0.95rem",
    color: "#374151",
    wordBreak: "break-word",
    animation: "fadeIn 0.3s ease",
  },
  divider: {
    width: "2px",
    background:
      "repeating-linear-gradient(to bottom, #d1d5db, #d1d5db 4px, transparent 4px, transparent 8px)",
  },
  diffOutput: {
    marginTop: "40px",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    width: "100%",
    maxWidth: "900px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
    minHeight: "150px",
    overflowX: "auto",
    fontFamily: "'JetBrains Mono', monospace",
    transition: "all 0.3s ease",
  },
};
