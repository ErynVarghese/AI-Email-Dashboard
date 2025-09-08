import React from "react";

const API = "http://localhost:8000/api";

export default function MicrosoftLogin() {
  const handleLogin = () => {
    window.location.href = `${API}/auth/login`;
  };

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h2>Sign in with Microsoft</h2>
      <button onClick={handleLogin} style={{ padding: "10px 20px", fontSize: 16 }}>
        Sign In
      </button>
    </div>
  );
}
