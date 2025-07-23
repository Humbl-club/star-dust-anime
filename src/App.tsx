
import React from 'react';

// Make sure it's a default export
const App = () => {
  console.log('App component rendering');
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>App Component Loaded!</h1>
      <p>React is working in App component</p>
    </div>
  );
};

// Explicit default export
export default App;
