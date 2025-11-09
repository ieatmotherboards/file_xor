import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthRoute() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await fetch(`/api/@me`, { // fill in with correct
          credentials: "include",
        });
        const data = await res.json();

        if (data.success) {
          navigate("/");
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        navigate("/login");
      }
    };

    verifyAuth();
  }, [navigate]);

  return isAuthenticated ? children : null; // change me
}
