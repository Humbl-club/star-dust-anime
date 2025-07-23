
import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  console.log('App rendering with Routes');
  
  return (
    <div style={{ backgroundColor: 'white', padding: '20px' }}>
      <h1 style={{ color: 'black' }}>Testing Routes</h1>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <div>
              <h2 style={{ color: 'green' }}>✅ Home Route Works!</h2>
              <p>Router and Routes are functioning properly</p>
            </div>
          } />
          <Route path="*" element={
            <div>
              <h2 style={{ color: 'red' }}>404 - Not Found</h2>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
