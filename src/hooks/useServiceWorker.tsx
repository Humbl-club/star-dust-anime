import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useServiceWorker = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        setRegistration(reg);
        
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              toast.info('Update available! Refresh to get the latest version.');
            }
          });
        });
        
        // Check for updates periodically
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000); // Every hour
        
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    };
    
    registerSW();
    
    // Handle offline/online events
    const handleOnline = () => toast.success('Back online!');
    const handleOffline = () => toast.error('You are offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const updateServiceWorker = () => {
    if (updateAvailable && registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };
  
  return {
    registration,
    updateAvailable,
    updateServiceWorker
  };
};