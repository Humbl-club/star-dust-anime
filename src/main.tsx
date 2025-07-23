// THIS MUST BE THE VERY FIRST IMPORT
import './fix-react';

import React from 'react';
import ReactDOM from 'react-dom/client';
// import App from './App.tsx';
import AppSimple from './AppSimple'; // Test with simple app first
import './index.css';
import './native.css';
// import { toast } from '@/hooks/use-toast';
// import { ToastAction } from '@/components/ui/toast';

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

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppSimple />
  </React.StrictMode>
);
