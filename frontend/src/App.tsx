// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MicrosoftLogin from './pages/MicrosoftLogin';
import EmailPage from './pages/EmailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MicrosoftLogin />} />
         <Route path="/email-page" element={<EmailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
