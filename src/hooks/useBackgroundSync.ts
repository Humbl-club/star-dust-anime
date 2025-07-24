import { useCallback, useEffect, useState } from 'react';
import { indexedDBManager } from '@/lib/storage/indexedDB';
import { OfflineAction, UserTitleListItem } from '@/types/userLists';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const scheduleUserListUpdate = useCallback(async (listItem: UserTitleListItem) => {
    try {
      setIsSyncing(true);
      // Cache the list item with pending sync status
      await indexedDBManager.cacheUserListItem({
        ...listItem,
        cached_at: Date.now(),
        sync_status: 'pending'
      });
      
      // Update queue size
      const pendingActions = await indexedDBManager.getPendingActions();
      const pendingSyncItems = await indexedDBManager.getPendingSyncItems();
      setQueueSize(pendingActions.length + pendingSyncItems.length);
      
      // Register background sync
      await registerBackgroundSync('user-lists');
      
      console.log('User list update scheduled:', listItem.id);
    } catch (error) {
      console.error('Failed to schedule user list update:', error);
      toast.error('Failed to queue list update');
    } finally {
      setIsSyncing(false);
    }
  }, [registerBackgroundSync]);

  const syncUserListItems = useCallback(async () => {
    if (!navigator.onLine) return;
    
    try {
      const pendingItems = await indexedDBManager.getPendingSyncItems();
      let syncedCount = 0;
      let failedCount = 0;
      
      for (const item of pendingItems) {
        try {
          // Attempt to sync with Supabase
          const { error } = await supabase
            .from('user_title_lists')
            .upsert({
              id: item.id,
              user_id: item.user_id,
              title_id: item.title_id,
              media_type: item.media_type,
              status_id: item.status_id,
              rating: item.rating,
              progress: item.progress,
              notes: item.notes,
              sort_order: item.sort_order,
              updated_at: new Date().toISOString()
            });
          
          if (error) {
            await indexedDBManager.updateSyncStatus(item.id, 'failed');
            failedCount++;
          } else {
            await indexedDBManager.updateSyncStatus(item.id, 'synced');
            syncedCount++;
          }
        } catch (error) {
          console.error('Error syncing list item:', error);
          await indexedDBManager.updateSyncStatus(item.id, 'failed');
          failedCount++;
        }
      }
      
      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} list updates`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to sync ${failedCount} list updates`);
      }
      
      // Update queue size
      const remainingActions = await indexedDBManager.getPendingActions();
      const remainingSyncItems = await indexedDBManager.getPendingSyncItems();
      setQueueSize(remainingActions.length + remainingSyncItems.length);
      
    } catch (error) {
      console.error('Error during user list sync:', error);
    }
  }, []);

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

  // Auto-sync when online
  useEffect(() => {
    const handleOnline = () => {
      syncUserListItems();
    };

    window.addEventListener('online', handleOnline);
    
    // Also sync on initial load if online
    if (navigator.onLine) {
      syncUserListItems();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncUserListItems]);

  return {
    registerBackgroundSync,
    scheduleOfflineAction,
    scheduleUserListUpdate,
    syncUserListItems,
    queueSize,
    isSyncing
  };
};