import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import ShowError from '../utils/ShowError';



export default function CreateAccount() {

    const navigate = useNavigate();

    const [errorMessage, setErrorMessage] = useState('');
    
    
    const [watermarkProgress, setWatermarkProgress] = useState(0);
    const canvasRef = useRef(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');

    const resolveCreateAccount = async () => {
        if (password !== password2){
            setErrorMessage("passwords do not match twin"); // CHANGE ME LATER
        }

        try {
            const res = await fetch('https://www-student.cse.buffalo.edu/~holdenen/create_account', {
                method:'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ "username": username, "password": password})
            });

            const data = await res.json();
            if (data.success) {
                console.log('success!');
                navigate('/login');
            } else {
                setErrorMessage('Invalid credentials'); // CHANGE ME LATER TOO
                console.log(data.error);  
            }
        } catch{
            console.error("failed to fetch create account API endpoint")
        }
    }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const gateWidth = 200;
    const gateHeight = 120;
    const inputLineLength = 180;
    const outputLineLength = 180;
    
    const angle = Math.PI / 4;

    const drawWatermark = (progress) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#A78BFA';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.15;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      const segments = 7;
      const segmentProgress = progress * segments;

      if (segmentProgress >= 0) {
        const localProgress = Math.min(segmentProgress, 1);
        ctx.beginPath();
        ctx.moveTo(-inputLineLength - gateWidth/2, -gateHeight/4);
        ctx.lineTo(-inputLineLength - gateWidth/2 + inputLineLength * localProgress, -gateHeight/4);
        ctx.stroke();
      }

      if (segmentProgress >= 1) {
        const localProgress = Math.min(segmentProgress - 1, 1);
        ctx.beginPath();
        ctx.moveTo(-inputLineLength - gateWidth/2, gateHeight/4);
        ctx.lineTo(-inputLineLength - gateWidth/2 + inputLineLength * localProgress, gateHeight/4);
        ctx.stroke();
      }

      if (segmentProgress >= 2) {
        const localProgress = Math.min(segmentProgress - 2, 1);
        ctx.beginPath();
        const startAngle = -Math.PI/2;
        const endAngle = Math.PI/2;
        ctx.arc(-gateWidth/2 - 15, 0, gateHeight/2, startAngle, startAngle + (endAngle - startAngle) * localProgress);
        ctx.stroke();
      }

      if (segmentProgress >= 3) {
        const localProgress = Math.min(segmentProgress - 3, 1);
        ctx.beginPath();
        const startAngle = -Math.PI/2;
        const endAngle = Math.PI/2;
        ctx.arc(-gateWidth/2, 0, gateHeight/2, startAngle, startAngle + (endAngle - startAngle) * localProgress);
        ctx.stroke();
      }

      if (segmentProgress >= 4) {
        const localProgress = Math.min(segmentProgress - 4, 1);
        ctx.beginPath();
        ctx.moveTo(-gateWidth/2, -gateHeight/2);
        
        const cpX = gateWidth/4;
        const cpY = -gateHeight/3;
        const endX = gateWidth/2;
        const endY = 0;
        
        const currentX = -gateWidth/2 + (cpX + gateWidth/2) * localProgress;
        const currentY = -gateHeight/2 + (cpY + gateHeight/2) * localProgress;
        
        if (localProgress < 0.5) {
          ctx.quadraticCurveTo(
            -gateWidth/2 + (cpX + gateWidth/2) * (localProgress * 2),
            -gateHeight/2 + (cpY + gateHeight/2) * (localProgress * 2),
            currentX,
            currentY
          );
        } else {
          const t = (localProgress - 0.5) * 2;
          ctx.quadraticCurveTo(cpX, cpY, cpX + (endX - cpX) * t, cpY + (endY - cpY) * t);
        }
        ctx.stroke();
      }

      if (segmentProgress >= 5) {
        const localProgress = Math.min(segmentProgress - 5, 1);
        ctx.beginPath();
        ctx.moveTo(-gateWidth/2, gateHeight/2);
        
        const cpX = gateWidth/4;
        const cpY = gateHeight/3;
        const endX = gateWidth/2;
        const endY = 0;
        
        if (localProgress < 0.5) {
          const currentX = -gateWidth/2 + (cpX + gateWidth/2) * (localProgress * 2);
          const currentY = gateHeight/2 + (cpY - gateHeight/2) * (localProgress * 2);
          ctx.quadraticCurveTo(
            -gateWidth/2 + (cpX + gateWidth/2) * (localProgress * 2),
            gateHeight/2 + (cpY - gateHeight/2) * (localProgress * 2),
            currentX,
            currentY
          );
        } else {
          const t = (localProgress - 0.5) * 2;
          ctx.quadraticCurveTo(cpX, cpY, cpX + (endX - cpX) * t, cpY + (endY - cpY) * t);
        }
        ctx.stroke();
      }

      if (segmentProgress >= 6) {
        const localProgress = Math.min(segmentProgress - 6, 1);
        ctx.beginPath();
        ctx.moveTo(gateWidth/2, 0);
        ctx.lineTo(gateWidth/2 + outputLineLength * localProgress, 0);
        ctx.stroke();
      }

      ctx.restore();
    };

    const duration = 4000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      drawWatermark(progress);
      setWatermarkProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawWatermark(watermarkProgress);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    background: 'linear-gradient(to bottom, #111827, #0a0a0f, #000000)',
    margin: 0,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const canvasStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 0
  };

  const vignetteStyle1 = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, transparent, transparent, rgba(0,0,0,0.7))',
    opacity: 0.7,
    pointerEvents: 'none',
    zIndex: 10
  };

  const vignetteStyle2 = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle, transparent, transparent, rgba(0,0,0,0.5))',
    opacity: 0.5,
    pointerEvents: 'none',
    zIndex: 10
  };

  const formContainerStyle = {
    position: 'relative',
    zIndex: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    backdropFilter: 'blur(10px)',
    padding: '48px',
    borderRadius: '12px',
    border: '1px solid rgba(156, 220, 254, 0.2)',
    width: '400px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
  };

  const titleStyle = {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'JetBrains Mono, monospace',
    margin: '0 0 32px 0',
    textAlign: 'center'
  };

  const labelStyle = {
    display: 'block',
    color: '#D1D5DB',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '14px',
    marginBottom: '8px',
    marginTop: '16px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    border: '1px solid #4B5563',
    borderRadius: '6px',
    color: 'white',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '16px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const buttonStyle = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#9CDCFE',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
    marginTop: '24px',
    transition: 'all 0.3s ease'
  };

  const linkStyle = {
    display: 'block',
    textAlign: 'center',
    marginTop: '16px',
    color: '#9CA3AF',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '14px',
    textDecoration: 'none',
    cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      <div style={vignetteStyle1}></div>
      <div style={vignetteStyle2}></div>

      {errorMessage && (
              <ShowError
                message={errorMessage}
                onClose={() => setErrorMessage('')}
              />
      )}

      <div style={formContainerStyle}>
        <h1 style={titleStyle}>create account</h1>
        
        <div>
          <label style={labelStyle}>
            username
            <input 
              type="text" 
              style={inputStyle}
              value={username}
              onFocus={(e) => e.target.style.borderColor = '#9CDCFE'}
              onBlur={(e) => e.target.style.borderColor = '#4B5563'}
              onChange={(e) => setUsername(e.target.value)}

            />
          </label>

          <label style={labelStyle}>
            password
            <input 
              type="password"
              value={password}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#9CDCFE'}
              onBlur={(e) => e.target.style.borderColor = '#4B5563'}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label style={labelStyle}>
            re-enter password
            <input 
              type="password"
              value={password2}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#9CDCFE'}
              onBlur={(e) => e.target.style.borderColor = '#4B5563'}
              onChange={(e) => setPassword2(e.target.value)}

            />
          </label>

          <button
            style={buttonStyle}
            onClick={() => resolveCreateAccount()}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            
          >
            Create Account
          </button>
        </div>

        <a onClick={() => navigate("/login")} style={linkStyle}>
          already have an account? <span style={{color: '#9CDCFE'}}>log in</span>
        </a>
      </div>
    </div>
  );
}