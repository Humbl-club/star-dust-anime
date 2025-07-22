import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './native.css'
import { toast } from '@/hooks/use-toast'

// Register service worker for caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              toast({
                title: 'New version available!',
                description: 'Refresh to update to the latest version.',
              });
            }
          });
        });
      })
      .catch(error => console.error('❌ Service Worker registration failed:', error));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
