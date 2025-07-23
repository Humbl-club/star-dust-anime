
import './radix-bypass';
import './module-preload';
import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('Main.tsx executing');
console.log('Main.tsx loaded');

const root = document.getElementById('root');
console.log('Root element:', root);

if (root) {
  ReactDOM.createRoot(root).render(
    <div style={{ padding: '50px' }}>
      <h1>React is working!</h1>
      <p>React version: {React.version}</p>
    </div>
  );
} else {
  document.body.innerHTML = '<h1>No root element found!</h1>';
}
