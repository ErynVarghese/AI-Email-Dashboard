import React, { useEffect } from 'react';

const MicrosoftLogin = () => {
  
  useEffect(() => {
    // Check login status by calling a simple backend endpoint
    fetch('http://localhost:8000/api/emails/', {
      credentials: 'include' // VERY IMPORTANT for session-based auth
    })
      .then(res => {
        if (res.status === 200) {
          // Already signed in — redirect to email view
          window.location.href = '/emails'; // or whatever page/component you want
        }

        
      })
      .catch(err => {
        console.log('User not signed in yet.');
      });
  }, []);

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
