import './react-shim'; // MUST be first import
import { React, ReactDOM } from './react-shim';
import App from './App.tsx';
import './index.css';
import './native.css';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

// Enhanced Service Worker registration with comprehensive offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration);
        
        // Listen for updates - new version available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            console.log('🔄 New Service Worker installing...');
            
            newWorker.addEventListener('statechange', () => {
              console.log('Service Worker state changed:', newWorker.state);
              
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - show update notification
                console.log('📢 New version available');
                toast({
                  title: 'New version available! 🚀',
                  description: 'Click to reload and get the latest features.',
                  action: (
                    <ToastAction altText="Update Now" onClick={() => {
                      console.log('User clicked update, reloading...');
                      window.location.reload();
                    }}>
                      Update Now
                    </ToastAction>
                  ),
                  duration: 10000, // Show for 10 seconds
                });
              } else if (newWorker.state === 'activated') {
                console.log('✅ New Service Worker activated');
                toast({
                  title: 'App updated! ✨',
                  description: 'You\'re now using the latest version.',
                  duration: 3000,
                });
              }
            });
          }
        });
        
        // Handle successful installation
        if (registration.active && !navigator.serviceWorker.controller) {
          console.log('✨ Service Worker installed for the first time');
          toast({
            title: 'Offline support enabled! 📱',
            description: 'The app will now work offline with cached content.',
            duration: 5000,
          });
        }
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
        toast({
          title: 'Offline mode unavailable',
          description: 'Some features may not work without internet.',
          variant: 'destructive',
          duration: 5000,
        });
      });
  });
  
  // Listen for Service Worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📨 Message from Service Worker:', event.data);
    
    if (event.data.type === 'CACHE_UPDATED') {
      toast({
        title: 'Content updated',
        description: 'Fresh content has been cached for offline use.',
        duration: 3000,
      });
    } else if (event.data.type === 'OFFLINE_READY') {
      toast({
        title: 'Ready for offline use',
        description: 'Your content is now available offline.',
        duration: 3000,
      });
    }
  });
  
  // Handle online/offline status
  const updateOnlineStatus = () => {
    if (navigator.onLine) {
      console.log('🌐 Back online');
      toast({
        title: 'Connection restored! 🌐',
        description: 'Syncing latest content...',
        duration: 3000,
      });
    } else {
      console.log('📴 Gone offline');
      toast({
        title: 'You\'re offline 📴',
        description: 'Using cached content. Some features may be limited.',
        duration: 5000,
      });
    }
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
