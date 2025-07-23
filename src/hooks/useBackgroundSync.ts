import { useCallback, useEffect, useState } from 'react';
import { indexedDBManager } from '@/lib/storage/indexedDB';
import { OfflineAction } from '@/types/userLists';

export const useBackgroundSync = () => {
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const registerBackgroundSync = useCallback(async (tag: string) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Note: Background Sync API may not be available in all browsers
        if ('sync' in registration) {
          await (registration as any).sync.register(tag);
          console.log('Background sync registered:', tag);
        } else {
          console.warn('Background sync not supported');
        }
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }, []);

  const scheduleOfflineAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retry_count'>) => {
    try {
      setIsSyncing(true);
      // Add to IndexedDB
      await indexedDBManager.addOfflineAction(action);
      
      // Update queue size
      const pendingActions = await indexedDBManager.getPendingActions();
      setQueueSize(pendingActions.length);
      
      // Register background sync
      await registerBackgroundSync('offline-actions');
      
      console.log('Offline action scheduled:', action.type);
    } catch (error) {
      console.error('Failed to schedule offline action:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [registerBackgroundSync]);

  // Update queue size periodically
  useEffect(() => {
    const updateQueueSize = async () => {
      try {
        const pendingActions = await indexedDBManager.getPendingActions();
        setQueueSize(pendingActions.length);
      } catch (error) {
        console.error('Failed to get queue size:', error);
      }
    };

    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    registerBackgroundSync,
    scheduleOfflineAction,
    queueSize,
    isSyncing
  };
};