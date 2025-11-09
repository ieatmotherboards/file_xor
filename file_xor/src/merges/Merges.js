import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

export default function MergeHistory() {
  const [merges, setMerges] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch merge history from backend
    const fetchMerges = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/get_merges`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (data.merges) {
          setMerges(data.merges);
        }
      } catch (error) {
        console.error('Failed to fetch merge history:', error);
      }
    };

    fetchMerges();
  }, []);

  const handleMergeClick = (mergeId) => {
    // Navigate to the merge detail/edit page
    window.location.href = `/merge/${mergeId}`; 
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#1e1e1e',
    color: '#dcdcdc',
    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
  };

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
    left: sidebarOpen ? 0 : '-300px',
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

  const contentStyle = {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const headingStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#9cdcfe',
    marginBottom: '1.5rem',
    fontFamily: 'JetBrains Mono, monospace',
  };

  const mergeGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))',
    gap: '1.5rem',
  };

  const mergeBoxStyle = {
    backgroundColor: '#252526',
    border: '1px solid #3a3a3a',
    borderRadius: '8px',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    gap: '1rem',
    position: 'relative',
  };

  const dividerStyle = {
    width: '1px',
    backgroundColor: '#555',
    alignSelf: 'stretch',
  };

  const fileHalfStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const fileNameStyle = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#dcdcdc',
    marginBottom: '4px',
  };

  const fileTypeStyle = {
    fontSize: '0.85rem',
    color: '#858585',
    marginBottom: '8px',
  };

  const previewBoxStyle = {
    backgroundColor: '#2d2d2d',
    border: '1px solid #3a3a3a',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '0.75rem',
    lineHeight: '1.5',
    color: '#c8c8c8',
    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
    overflow: 'hidden',
    maxHeight: '80px',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#858585',
  };

  return (
    <div style={containerStyle}>
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
          onClick={() => window.location.href = '/'}
        >
          Home
        </div>
        <div
          style={sidebarLinkStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#2d2d2d')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          onClick={() => window.location.href = '/history'}
        >
          Merge History
        </div>
        <div
          style={sidebarLinkStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#2d2d2d')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          onClick={() => navigate("/landing")}
        >
          Logout
        </div>
      </div>

      {/* Main Content */}
      <div style={contentStyle}>
        <h1 style={headingStyle}>merge history</h1>

        {merges.length === 0 ? (
          <div style={emptyStateStyle}>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              No merges yet
            </p>
            <p style={{ fontSize: '0.9rem' }}>
              Create your first merge to see it here
            </p>
          </div>
        ) : (
          <div style={mergeGridStyle}>
            {merges.map((merge, index) => (
              <div
                key={index}
                style={mergeBoxStyle}
                onClick={() => handleMergeClick(merge.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px rgba(10, 162, 255, 0.3)';
                  e.currentTarget.style.borderColor = '#0aa2ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#3a3a3a';
                }}
              >
                {/* Left File */}
                <div style={fileHalfStyle}>
                  <div style={fileNameStyle}>{merge.left_name || 'file_a'}</div>
                  <div style={fileTypeStyle}>
                    {merge.left_extension || 'txt'} file
                  </div>
                  <div style={previewBoxStyle}>
                    {merge.left_first_lines && merge.left_first_lines.length > 0
                      ? merge.left_first_lines.map((line, i) => (
                          <div key={i}>{line || '\u00A0'}</div>
                        ))
                      : 'Empty file'}
                  </div>
                </div>

                {/* Divider */}
                <div style={dividerStyle}></div>

                {/* Right File */}
                <div style={fileHalfStyle}>
                  <div style={fileNameStyle}>
                    {merge.right_name || 'file_b'}
                  </div>
                  <div style={fileTypeStyle}>
                    {merge.right_extension || 'txt'} file
                  </div>
                  <div style={previewBoxStyle}>
                    {merge.right_first_lines &&
                    merge.right_first_lines.length > 0
                      ? merge.right_first_lines.map((line, i) => (
                          <div key={i}>{line || '\u00A0'}</div>
                        ))
                      : 'Empty file'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}