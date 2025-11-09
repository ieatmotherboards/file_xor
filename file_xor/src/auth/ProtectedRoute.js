import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";


export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();
  

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('https://www-student.cse.buffalo.edu/~holdenen/verify_token', {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          navigate("/login");
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        navigate("/login");

      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    // Optional: Show a loading spinner while checking auth
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#9cdcfe',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        Loading...
      </div>
    );
  }

  return isAuthenticated ? children : null;
}