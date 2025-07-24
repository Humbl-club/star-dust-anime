import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, HardDrive } from 'lucide-react';

export const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheInfo, setCacheInfo] = useState<{
    hasCache: boolean;
    cacheSize?: string;
  }>({ hasCache: false });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Connection restored! 🌐',
        description: 'Syncing latest content...',
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You\'re offline 📴',
        description: 'Using cached content. Some features may be limited.',
        duration: 5000,
      });
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { data } = event;
      
      if (data.type === 'CACHE_UPDATED') {
        checkCacheStatus();
      } else if (data.type === 'OFFLINE_READY') {
        setCacheInfo({ hasCache: true });
        toast({
          title: 'Offline support enabled! 📱',
          description: 'The app will now work offline with cached content.',
          duration: 5000,
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Initial cache check
    checkCacheStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  const checkCacheStatus = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const hasCache = cacheNames.length > 0;
        
        if (hasCache) {
          // Estimate cache size
          let totalSize = 0;
          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            totalSize += keys.length;
          }
          
          setCacheInfo({
            hasCache: true,
            cacheSize: `${totalSize} items`,
          });
        }
      } catch (error) {
        console.warn('Could not check cache status:', error);
      }
    }
  };

  // Don't show anything if online and no special cache info
  if (isOnline && !cacheInfo.hasCache) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-modal flex gap-2">
      {/* Connection Status */}
      <Badge
        variant={isOnline ? 'default' : 'secondary'}
        className={`
          flex items-center gap-1 px-2 py-1 text-xs
          ${isOnline 
            ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
            : 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
          }
        `}
      >
        {isOnline ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>

      {/* Cache Status */}
      {cacheInfo.hasCache && (
        <Badge
          variant="outline"
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
        >
          <HardDrive className="w-3 h-3" />
          {cacheInfo.cacheSize || 'Cached'}
        </Badge>
      )}
    </div>
  );
};