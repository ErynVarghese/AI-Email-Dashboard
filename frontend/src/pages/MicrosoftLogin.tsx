import React from "react";
import "./MicrosoftLogin.css";

const API = "http://localhost:8000/api";

export default function MicrosoftLogin() {
  const handleLogin = () => {
    window.location.href = `${API}/auth/login`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">📧</div>
          <h1 className="login-title">AI Email Dashboard</h1>
        </div>

        <div className="login-content">
          <p className="login-description">
            Analyze and filter your emails with AI-powered spam detection. Sign in with your Microsoft account to get started.
          </p>

          <button onClick={handleLogin} className="login-button">
            <span className="button-icon">🔐</span>
            <span>Sign in with Microsoft</span>
          </button>

        </div>

        <div className="login-footer">
          <p className="footer-text">Your email is private and secure. Only spam predictions are stored.</p>
        </div>
      </div>
    </div>
  );
}
