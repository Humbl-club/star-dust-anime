import { useState, useEffect } from 'react';
import { offlineStorage } from '@/lib/cache/offlineStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstalled();

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger background sync when coming back online
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          return (registration as any).sync.register('background-sync');
        });
      }
    };

    const handleOffline = () => setIsOnline(false);

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      // Track installation
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'pwa_install_success', {
          event_category: 'PWA',
          event_label: 'App Installed'
        });
      }
    };

    // Service worker update detection
    const handleServiceWorkerUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleServiceWorkerUpdate);
    }

    // Initialize offline storage
    offlineStorage.init();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleServiceWorkerUpdate);
      }
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      
      setDeferredPrompt(null);
      setIsInstallable(false);

      if (choice.outcome === 'accepted') {
        // Track successful installation
        if (typeof (window as any).gtag !== 'undefined') {
          (window as any).gtag('event', 'pwa_install_accepted', {
            event_category: 'PWA',
            event_label: 'Install Prompt Accepted'
          });
        }
        return true;
      } else {
        // Track dismissal
        if (typeof (window as any).gtag !== 'undefined') {
          (window as any).gtag('event', 'pwa_install_dismissed', {
            event_category: 'PWA',
            event_label: 'Install Prompt Dismissed'
          });
        }
        return false;
      }
    } catch (error) {
      console.error('Install failed:', error);
      return false;
    }
  };

  const refreshApp = () => {
    window.location.reload();
  };

  return {
    isOnline,
    isInstallable,
    isInstalled,
    updateAvailable,
    installApp,
    refreshApp
  };
};