
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const App = () => {
  console.log('Current path:', window.location.pathname);
  
  return (
    <div style={{ backgroundColor: 'white', padding: '20px' }}>
      <h1 style={{ color: 'black' }}>Testing Routes</h1>
      <p>Current URL: {window.location.pathname}</p>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <div>
              <h2 style={{ color: 'green' }}>✅ Home Route Works!</h2>
            </div>
          } />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="*" element={
            <div>
              <h2 style={{ color: 'orange' }}>✅ Router Works!</h2>
              <p>Path: {window.location.pathname}</p>
              <p>This proves routing is functioning</p>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
