import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff } from 'lucide-react';
import { toast } from 'sonner';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing your changes...', {
        icon: <Wifi className="h-4 w-4" />,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You\'re offline. Changes will sync when connection is restored.', {
        icon: <WifiOff className="h-4 w-4" />,
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Check for pending sync items
    const checkPendingSync = async () => {
      try {
        const { indexedDBManager } = await import('@/lib/storage/indexedDB');
        const pendingItems = await indexedDBManager.getPendingSyncItems();
        const pendingActions = await indexedDBManager.getPendingActions();
        setPendingSyncCount(pendingItems.length + pendingActions.length);
      } catch (error) {
        console.error('Error checking pending sync:', error);
      }
    };

    checkPendingSync();
    const interval = setInterval(checkPendingSync, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (isOnline && pendingSyncCount === 0) {
    return null; // Don't show indicator when online and no pending sync
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${className}`}>
      {isOnline ? (
        <>
          <Cloud className="h-4 w-4 text-orange-500" />
          <span className="text-orange-700 dark:text-orange-300">
            Syncing {pendingSyncCount} item{pendingSyncCount !== 1 ? 's' : ''}...
          </span>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4 text-red-500" />
          <span className="text-red-700 dark:text-red-300">
            Offline mode
            {pendingSyncCount > 0 && ` (${pendingSyncCount} pending)`}
          </span>
        </>
      )}
    </div>
  );
};