import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './native.css'
import { register as registerSW } from './utils/serviceWorkerRegistration'
import { initializePerformanceOptimizations } from './utils/performanceOptimizations'
// Initialize performance optimizations
initializePerformanceOptimizations();

// Register service worker for offline support
if (import.meta.env.PROD) {
  registerSW({
    onSuccess: () => console.log('App ready for offline use'),
    onUpdate: () => console.log('New content available'),
    onOfflineReady: () => console.log('App cached for offline use')
  });
}

createRoot(document.getElementById("root")!).render(<App />);
