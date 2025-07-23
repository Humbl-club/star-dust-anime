// src/AppSimple.tsx - Temporary test file
import React from 'react';

const AppSimple = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Testing React: {React.version}</h1>
      <p>React is {React ? 'available' : 'NOT available'}</p>
      <p>useState is {React.useState ? 'available' : 'NOT available'}</p>
      <p>useEffect is {React.useEffect ? 'available' : 'NOT available'}</p>
      <p>All React hooks: {Object.keys(React).filter(key => key.startsWith('use')).join(', ')}</p>
    </div>
  );
};

export default AppSimple;