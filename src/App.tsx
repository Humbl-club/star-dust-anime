
import React from 'react';
import { BrowserRouter } from "react-router-dom";

const App = () => {
  console.log('App rendering');
  console.log('BrowserRouter exists:', !!BrowserRouter);
  
  return (
    <div style={{ 
      position: 'relative', 
      zIndex: 100, 
      backgroundColor: 'white', 
      padding: '50px' 
    }}>
      <h1 style={{ color: 'black' }}>Before Router</h1>
      <BrowserRouter>
        <div>
          <h2 style={{ color: 'black' }}>Inside Router!</h2>
        </div>
      </BrowserRouter>
      <h3 style={{ color: 'black' }}>After Router</h3>
    </div>
  );
};

export default App;
