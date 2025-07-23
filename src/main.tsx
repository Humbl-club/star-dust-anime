
import './radix-bypass';
import './module-preload';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Main.tsx loaded, React:', React.version);

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <div>
      <h1>Testing App Component...</h1>
      <App />
    </div>
  );
}
