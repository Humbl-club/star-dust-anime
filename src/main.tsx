import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './native.css'
import { register as registerSW } from './utils/serviceWorkerRegistration'
import { initializePerformanceOptimizations } from './utils/performanceOptimizations'
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring'

// Initialize performance optimizations
initializePerformanceOptimizations();

// Initialize performance monitoring
const PerformanceMonitor = () => {
  usePerformanceMonitoring({
    reportWebVitals: true,
    reportCustomMetrics: true,
    onMetric: (metric) => {
      if (import.meta.env.DEV) {
        console.log('Performance Metric:', metric);
      }
    }
  });
  return null;
};

// Register service worker for offline support
if (import.meta.env.PROD) {
  registerSW({
    onSuccess: () => console.log('App ready for offline use'),
    onUpdate: () => console.log('New content available'),
    onOfflineReady: () => console.log('App cached for offline use')
  });
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <>
    <PerformanceMonitor />
    <App />
  </>
);
