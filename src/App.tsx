
import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  console.log('App with Router');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div><h1>Home Page Works!</h1></div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
