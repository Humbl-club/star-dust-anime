// Must be first - this loads React globally
import './module-preload';

// Use the globally loaded React
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Verify React is available
console.log('Main: React version', (window as any).React.version);
console.log('Main: Global React', !!(window as any).React);

// Simplified service worker registration for testing
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('✅ Service Worker registered'))
    .catch(() => console.log('❌ Service Worker registration failed'));
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const React = (window as any).React;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
