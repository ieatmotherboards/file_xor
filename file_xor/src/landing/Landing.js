import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";


export default function FileXorLanding() {

  const navigate = useNavigate();

  const [titleVisible, setTitleVisible] = useState(false);
  const [watermarkProgress, setWatermarkProgress] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 100);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // XOR gate dimensions (rotated 45 degrees for diagonal orientation)
    const gateWidth = 200 * 2;
    const gateHeight = 120 * 2;
    const inputLineLength = 180 * 10;
    const outputLineLength = 180 * 2;
    
    // Calculate rotated positions (45 degree diagonal)
    const angle = Math.PI / 4; // 45 degrees
    const cos45 = Math.cos(angle);
    const sin45 = Math.sin(angle);

    const drawWatermark = (progress) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#A78BFA';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.4;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      // Total animation segments
      const segments = 7;
      const segmentProgress = progress * segments;

      // Segment 1: Input A line
        if (segmentProgress >= 0) {
            const localProgress = Math.min(segmentProgress, 1);
            const startX = -inputLineLength - gateWidth/2;
            const endX = -gateWidth/2 + 90;
            
            ctx.beginPath();
            ctx.moveTo(startX, -gateHeight/4);
            ctx.lineTo(startX + (endX - startX) * localProgress, -gateHeight/4);
            ctx.stroke();
        }

        // Segment 2: Input B line
        if (segmentProgress >= 1) {
            const localProgress = Math.min(segmentProgress - 1, 1);
            const startX = -inputLineLength - gateWidth/2;
            const endX = -gateWidth/2 + 80;
            
            ctx.beginPath();
            ctx.moveTo(startX, gateHeight/4);
            ctx.lineTo(startX + (endX - startX) * localProgress, gateHeight/4);
            ctx.stroke();
        }
      // Segment 3: Extra XOR arc (left curved line)
      if (segmentProgress >= 2) {
        const localProgress = Math.min(segmentProgress - 2, 1);
        ctx.beginPath();
        const startAngle = -Math.PI/2;
        const endAngle = Math.PI/2;
        ctx.arc(-gateWidth/2 - 15, 0, gateHeight/2, startAngle, startAngle + (endAngle - startAngle) * localProgress);
        ctx.stroke();
      }

      // Segment 4: Main gate body arc
    //   if (segmentProgress >= 3) {
    //     const localProgress = Math.min(segmentProgress - 3, 1);
    //     ctx.beginPath();
    //     const startAngle = -Math.PI/2;
    //     const endAngle = Math.PI/2;
    //     ctx.arc(-gateWidth/2, 0, gateHeight/2, startAngle, startAngle + (endAngle - startAngle) * localProgress);
    //     ctx.stroke();
    //   }

      // Segment 5: Top curved line to output point
      if (segmentProgress >= 4) {
        const localProgress = Math.min(segmentProgress - 4, 1);
        ctx.beginPath();
        ctx.moveTo(-gateWidth/2, -gateHeight/2);
        
        // Quadratic curve to output point
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

      // Segment 6: Bottom curved line to output point
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

      // Segment 7: Output line
      if (segmentProgress >= 6) {
        const localProgress = Math.min(segmentProgress - 6, 1);
        ctx.beginPath();
        ctx.moveTo(gateWidth/2, 0);
        ctx.lineTo(gateWidth/2 + outputLineLength * localProgress, 0);
        ctx.stroke();
      }

      ctx.restore();
    };

    // Animate watermark
    const duration = 4000; // 4 seconds
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
    padding: 0
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

  const navStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '24px 32px',
    gap: '16px'
  };

  const buttonStyle = {
    padding: '8px 24px',
    color: '#D1D5DB',
    border: '1px solid #9CA3AF',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '16px',
    transition: 'all 0.3s ease'
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

  const titleContainerStyle = {
    position: 'absolute',
    top: '80px',
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 30
  };

  const titleStyle = {
    fontSize: '72px',
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: '0.05em',
    fontFamily: 'JetBrains Mono, monospace',
    margin: 0,
    transition: 'all 2s ease',
    opacity: titleVisible ? 1 : 0,
    transform: titleVisible ? 'translateY(0)' : 'translateY(-16px)'
  };

  const taglineStyle = {
    fontSize: '20px',
    color: '#9CA3AF',
    marginTop: '16px',
    fontFamily: 'JetBrains Mono, monospace',
    transition: 'all 2s ease',
    transitionDelay: '0.5s',
    opacity: titleVisible ? 1 : 0,
    transform: titleVisible ? 'translateY(0)' : 'translateY(-16px)'
  };

  const mainContentStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    overflow: 'hidden'
  };

  const documentsContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '200%',
    height: '200%',
    transform: 'scale(1.5) rotate(0deg)'
  };

  const leftDocStyle = {
    position: 'absolute',
    left: '25%',
    top: '40%',
    transform: 'rotate(-25deg) scale(1.8) translateX(-120px)',
    transformOrigin: 'center right'
  };

  const rightDocStyle = {
    position: 'absolute',
    right: '25%',
    top: '40%',
    transform: 'rotate(25deg) scale(1.8) translateX(120px)',
    transformOrigin: 'center left'
  };

  const xorContainerStyle = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)'
  };

  const tryItContainerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    marginTop: '128px'
  };

  const tryItButtonStyle = {
    padding: '16px 48px',
    backgroundColor: '#9CDCFE',
    color: 'white',
    fontSize: '20px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
    boxShadow: '0 20px 60px rgba(156, 220, 254, 0.3)',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-block'
  };

  const svgDropShadow = {
    filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))'
  };

  return (
    <div style={containerStyle}>
      {/* Watermark Canvas */}
      <canvas ref={canvasRef} style={canvasStyle} />

      {/* Navigation Bar */}
      <nav style={navStyle}>
        <button 
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1F2937';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#D1D5DB';
          }}
         onClick={() => navigate("/create-account")} // change me
        >
          Sign Up
        </button>
        <button 
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1F2937';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#D1D5DB';
          }}
         onClick={() => navigate("/login")} // change me

        >
          Login
        </button>
      </nav>

      {/* Vignette Overlay */}
      <div style={vignetteStyle1}></div>
      <div style={vignetteStyle2}></div>

      {/* Title and Tagline */}
      <div style={titleContainerStyle}>
        <h1 style={titleStyle}>file_xor</h1>
        <p style={taglineStyle}>Merge text dynamically and quickly</p>
      </div>

      {/* Main Content - Documents and XOR Symbol */}
      <div style={mainContentStyle}>
        <div style={documentsContainerStyle}>
          {/* Left Document */}
          <div style={leftDocStyle}>
            <svg width="300" height="380" viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={svgDropShadow}>
              <path d="M30 0H220L300 80V350C300 366.569 286.569 380 270 380H30C13.4315 380 0 366.569 0 350V30C0 13.4315 13.4315 0 30 0Z" fill="transparent" stroke="white" strokeWidth="8"/>
              <path d="M220 0L300 80H250C231.716 80 220 68.2843 220 50V0Z" fill="transparent" stroke="white" strokeWidth="6"/>
              <rect x="40" y="120" width="220" height="12" rx="6" fill="white"/>
              <rect x="40" y="155" width="220" height="12" rx="6" fill="white"/>
              <rect x="40" y="190" width="170" height="12" rx="6" fill="white"/>
              <rect x="40" y="225" width="220" height="12" rx="6" fill="white"/>
              <rect x="40" y="260" width="190" height="12" rx="6" fill="white"/>
              <rect x="40" y="295" width="220" height="12" rx="6" fill="white"/>
              <rect x="40" y="330" width="150" height="12" rx="6" fill="white"/>
            </svg>
          </div>

          {/* Right Document */}
          <div style={rightDocStyle}>
            <svg width="300" height="380" viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={svgDropShadow}>
              <path d="M30 0H220L300 80V350C300 366.569 286.569 380 270 380H30C13.4315 380 0 366.569 0 350V30C0 13.4315 13.4315 0 30 0Z" fill="transparent" stroke="white" strokeWidth="8"/>
              <path d="M220 0L300 80H250C231.716 80 220 68.2843 220 50V0Z" fill="transparent" stroke="white" strokeWidth="6"/>
              <rect x="40" y="120" width="220" height="12" rx="6" fill="white"/>
              <rect x="40" y="155" width="220" height="12" rx="6" fill="white"/>
              <rect x="40" y="190" width="170" height="12" rx="6" fill="white"/>
              <rect x="40" y="225" width="220" height="12" rx="6" fill="white"/>
              <rect x="40" y="260" width="190" height="12" rx="6" fill="white"/>
              <rect x="40" y="295" width="220" height="12" rx="6" fill="white"/>
              <rect x="40" y="330" width="150" height="12" rx="6" fill="white"/>
            </svg>
          </div>

          {/* XOR Symbol */}
          <div style={xorContainerStyle}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={svgDropShadow}>
              <circle cx="60" cy="60" r="55" fill="transparent" stroke="white" strokeWidth="4"/>
              <text x="60" y="75" fontSize="64" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="JetBrains Mono, monospace">⊕</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Try It Button */}
      <div style={tryItContainerStyle}>
        <a onClick={() => navigate("/create-account")} style={{textDecoration: 'none'}}>
          <button
            style={tryItButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
          >
            Try It!
          </button>
        </a>
      </div>
    </div>
  );
}


// import React, { useState, useEffect, useRef } from 'react';

// export default function FileXorLanding() {
//   const [titleVisible, setTitleVisible] = useState(false);
//   const [watermarkProgress, setWatermarkProgress] = useState(0);
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     setTimeout(() => setTitleVisible(true), 100);
//   }, []);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext('2d');
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;

//     const centerX = canvas.width / 2;
//     const centerY = canvas.height / 2;

//     // XOR gate dimensions (rotated 45 degrees for diagonal orientation)
//     const gateWidth = 200;
//     const gateHeight = 120;
//     const inputLineLength = 180;
//     const outputLineLength = 180;
    
//     // Calculate rotated positions (45 degree diagonal)
//     const angle = Math.PI / 4; // 45 degrees
//     const cos45 = Math.cos(angle);
//     const sin45 = Math.sin(angle);

//     const drawWatermark = (progress) => {
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.strokeStyle = '#A78BFA';
//       ctx.lineWidth = 3;
//       ctx.lineCap = 'round';
//       ctx.lineJoin = 'round';
//       ctx.globalAlpha = 0.15;

//       ctx.save();
//       ctx.translate(centerX, centerY);
//       ctx.rotate(angle);

//       // Total animation segments
//       const segments = 7;
//       const segmentProgress = progress * segments;

//       // Segment 1: Input A line
//       if (segmentProgress >= 0) {
//         const localProgress = Math.min(segmentProgress, 1);
//         ctx.beginPath();
//         ctx.moveTo(-inputLineLength - gateWidth/2, -gateHeight/4);
//         ctx.lineTo(-inputLineLength - gateWidth/2 + inputLineLength * localProgress, -gateHeight/4);
//         ctx.stroke();
//       }

//       // Segment 2: Input B line
//       if (segmentProgress >= 1) {
//         const localProgress = Math.min(segmentProgress - 1, 1);
//         ctx.beginPath();
//         ctx.moveTo(-inputLineLength - gateWidth/2, gateHeight/4);
//         ctx.lineTo(-inputLineLength - gateWidth/2 + inputLineLength * localProgress, gateHeight/4);
//         ctx.stroke();
//       }

//       // Segment 3: Extra XOR arc (left curved line)
//       if (segmentProgress >= 2) {
//         const localProgress = Math.min(segmentProgress - 2, 1);
//         ctx.beginPath();
//         const startAngle = -Math.PI/2;
//         const endAngle = Math.PI/2;
//         ctx.arc(-gateWidth/2 - 15, 0, gateHeight/2, startAngle, startAngle + (endAngle - startAngle) * localProgress);
//         ctx.stroke();
//       }

//       // Segment 4: Main gate body arc
//       if (segmentProgress >= 3) {
//         const localProgress = Math.min(segmentProgress - 3, 1);
//         ctx.beginPath();
//         const startAngle = -Math.PI/2;
//         const endAngle = Math.PI/2;
//         ctx.arc(-gateWidth/2, 0, gateHeight/2, startAngle, startAngle + (endAngle - startAngle) * localProgress);
//         ctx.stroke();
//       }

//       // Segment 5: Top curved line to output point
//       if (segmentProgress >= 4) {
//         const localProgress = Math.min(segmentProgress - 4, 1);
//         ctx.beginPath();
//         ctx.moveTo(-gateWidth/2, -gateHeight/2);
        
//         // Quadratic curve to output point
//         const cpX = gateWidth/4;
//         const cpY = -gateHeight/3;
//         const endX = gateWidth/2;
//         const endY = 0;
        
//         const currentX = -gateWidth/2 + (cpX + gateWidth/2) * localProgress;
//         const currentY = -gateHeight/2 + (cpY + gateHeight/2) * localProgress;
        
//         if (localProgress < 0.5) {
//           ctx.quadraticCurveTo(
//             -gateWidth/2 + (cpX + gateWidth/2) * (localProgress * 2),
//             -gateHeight/2 + (cpY + gateHeight/2) * (localProgress * 2),
//             currentX,
//             currentY
//           );
//         } else {
//           const t = (localProgress - 0.5) * 2;
//           ctx.quadraticCurveTo(cpX, cpY, cpX + (endX - cpX) * t, cpY + (endY - cpY) * t);
//         }
//         ctx.stroke();
//       }

//       // Segment 6: Bottom curved line to output point
//       if (segmentProgress >= 5) {
//         const localProgress = Math.min(segmentProgress - 5, 1);
//         ctx.beginPath();
//         ctx.moveTo(-gateWidth/2, gateHeight/2);
        
//         const cpX = gateWidth/4;
//         const cpY = gateHeight/3;
//         const endX = gateWidth/2;
//         const endY = 0;
        
//         if (localProgress < 0.5) {
//           const currentX = -gateWidth/2 + (cpX + gateWidth/2) * (localProgress * 2);
//           const currentY = gateHeight/2 + (cpY - gateHeight/2) * (localProgress * 2);
//           ctx.quadraticCurveTo(
//             -gateWidth/2 + (cpX + gateWidth/2) * (localProgress * 2),
//             gateHeight/2 + (cpY - gateHeight/2) * (localProgress * 2),
//             currentX,
//             currentY
//           );
//         } else {
//           const t = (localProgress - 0.5) * 2;
//           ctx.quadraticCurveTo(cpX, cpY, cpX + (endX - cpX) * t, cpY + (endY - cpY) * t);
//         }
//         ctx.stroke();
//       }

//       // Segment 7: Output line
//       if (segmentProgress >= 6) {
//         const localProgress = Math.min(segmentProgress - 6, 1);
//         ctx.beginPath();
//         ctx.moveTo(gateWidth/2, 0);
//         ctx.lineTo(gateWidth/2 + outputLineLength * localProgress, 0);
//         ctx.stroke();
//       }

//       ctx.restore();
//     };

//     // Animate watermark
//     const duration = 4000; // 4 seconds
//     const startTime = Date.now();
    
//     const animate = () => {
//       const elapsed = Date.now() - startTime;
//       const progress = Math.min(elapsed / duration, 1);
      
//       drawWatermark(progress);
//       setWatermarkProgress(progress);
      
//       if (progress < 1) {
//         requestAnimationFrame(animate);
//       }
//     };

//     animate();

//     const handleResize = () => {
//       canvas.width = window.innerWidth;
//       canvas.height = window.innerHeight;
//       drawWatermark(watermarkProgress);
//     };

//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   return (
//     <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-gray-900 via-gray-950 to-black">
//       {/* Watermark Canvas */}
//       <canvas
//         ref={canvasRef}
//         className="absolute inset-0 pointer-events-none z-0"
//       />

//       {/* Navigation Bar */}
//       <nav className="absolute top-0 left-0 right-0 z-50 flex justify-end items-center px-8 py-6 gap-4">
//         <button className="px-6 py-2 text-gray-300 border border-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
//           Sign Up
//         </button>
//         <button className="px-6 py-2 text-gray-300 border border-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
//           Login
//         </button>
//       </nav>

//       {/* Vignette Overlay */}
//       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-70 pointer-events-none z-10"></div>
//       <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black opacity-50 pointer-events-none z-10"></div>

//       {/* Title and Tagline */}
//       <div className="absolute top-20 left-0 right-0 flex flex-col items-center z-30">
//         <h1 
//           className={`text-7xl font-bold text-white tracking-wide transition-all duration-2000 ${
//             titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
//           }`}
//           style={{ transitionDuration: '2000ms', fontFamily: 'JetBrains Mono, monospace' }}
//         >
//           file_xor
//         </h1>
//         <p
//           className={`text-xl text-gray-400 mt-4 transition-all duration-2000 delay-500 ${
//             titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
//           }`}
//           style={{ transitionDuration: '2000ms', fontFamily: 'JetBrains Mono, monospace' }}
//         >
//           Merge text dynamically and quickly
//         </p>
//       </div>

//       {/* Main Content - Documents and XOR Symbol */}
//       <div className="absolute inset-0 flex items-center justify-center z-20 overflow-hidden">
//         <div className="relative flex items-center justify-center" style={{ width: '200%', height: '200%', transform: 'scale(1.5) rotate(0deg)' }}>
//           {/* Left Document - Bursting from center-left */}
//           <div className="absolute" style={{ 
//             left: '25%', 
//             top: '40%',
//             transform: 'rotate(-25deg) scale(1.8) translateX(-120px)',
//             transformOrigin: 'center right'
//           }}>
//             <svg width="300" height="380" viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
//               <path d="M30 0H220L300 80V350C300 366.569 286.569 380 270 380H30C13.4315 380 0 366.569 0 350V30C0 13.4315 13.4315 0 30 0Z" fill="transparent" stroke="white" strokeWidth="8"/>
//               <path d="M220 0L300 80H250C231.716 80 220 68.2843 220 50V0Z" fill="transparent" stroke="white" strokeWidth="6"/>
//               <rect x="40" y="120" width="220" height="12" rx="6" fill="white"/>
//               <rect x="40" y="155" width="220" height="12" rx="6" fill="white"/>
//               <rect x="40" y="190" width="170" height="12" rx="6" fill="white"/>
//               <rect x="40" y="225" width="220" height="12" rx="6" fill="white"/>
//               <rect x="40" y="260" width="190" height="12" rx="6" fill="white"/>
//               <rect x="40" y="295" width="220" height="12" rx="6" fill="white"/>
//               <rect x="40" y="330" width="150" height="12" rx="6" fill="white"/>
//             </svg>
//           </div>

//           {/* Right Document - Bursting from center-right */}
//           <div className="absolute" style={{ 
//             right: '25%', 
//             top: '40%',
//             transform: 'rotate(25deg) scale(1.8) translateX(120px)',
//             transformOrigin: 'center left'
//           }}>
//             <svg width="300" height="380" viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
//               <path d="M30 0H220L300 80V350C300 366.569 286.569 380 270 380H30C13.4315 380 0 366.569 0 350V30C0 13.4315 13.4315 0 30 0Z" fill="transparent" stroke="white" strokeWidth="8"/>
//               <path d="M220 0L300 80H250C231.716 80 220 68.2843 220 50V0Z" fill="transparent" stroke="white" strokeWidth="6"/>
//               <rect x="40" y="120" width="220" height="12" rx="6" fill="white"/>
//               <rect x="40" y="155" width="220" height="12" rx="6" fill="white"/>
//               <rect x="40" y="190" width="170" height="12" rx="6" fill="white"/>
//               <rect x="40" y="225" width="220" height="12" rx="6" fill="white"/>
//               <rect x="40" y="260" width="190" height="12" rx="6" fill="white"/>
//               <rect x="40" y="295" width="220" height="12" rx="6" fill="white"/>
//               <rect x="40" y="330" width="150" height="12" rx="6" fill="white"/>
//             </svg>
//           </div>

//           {/* XOR Symbol */}
//           <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
//             <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
//               <circle cx="60" cy="60" r="55" fill="transparent" stroke="white" strokeWidth="4"/>
//               <text x="60" y="75" fontSize="64" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="JetBrains Mono, monospace">⊕</text>
//             </svg>
//           </div>
//         </div>
//       </div>

//       {/* Try It Button */}
//       <div className="absolute inset-0 flex items-center justify-center z-40 mt-32">
//         <a href="/">
//           <button
//             className="px-12 py-4 text-white text-xl font-semibold rounded-lg shadow-2xl hover:scale-105 transition-all duration-300"
//             style={{ 
//               backgroundColor: '#9CDCFE',
//               fontFamily: 'JetBrains Mono, monospace',
//               boxShadow: '0 20px 60px rgba(156, 220, 254, 0.3)'
//             }}
//           >
//             Try It!
//           </button>
//         </a>
//       </div>
//     </div>
//   );
// }