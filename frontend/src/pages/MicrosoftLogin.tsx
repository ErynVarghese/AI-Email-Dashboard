
import React from 'react';

const MicrosoftLogin = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:8000/api/auth/login';
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Sign in with Microsoft</h2>
      <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Sign In
      </button>
    </div>
  );
};

export default MicrosoftLogin;
