import { useCallback } from 'react';
import { indexedDBManager } from '@/lib/storage/indexedDB';
import { OfflineAction } from '@/types/userLists';

export const useBackgroundSync = () => {
  const registerBackgroundSync = useCallback(async (tag: string) => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('Background sync registered:', tag);
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }, []);

  const scheduleOfflineAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retry_count'>) => {
    try {
      // Add to IndexedDB
      await indexedDBManager.addOfflineAction(action);
      
      // Register background sync
      await registerBackgroundSync('offline-actions');
      
      console.log('Offline action scheduled:', action.type);
    } catch (error) {
      console.error('Failed to schedule offline action:', error);
    }
  }, [registerBackgroundSync]);

  return {
    registerBackgroundSync,
    scheduleOfflineAction
  };
};