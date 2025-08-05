// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MicrosoftLogin from './pages/MicrosoftLogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MicrosoftLogin />} />
      </Routes>
    </Router>
  );
}

export default App;
