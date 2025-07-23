import { useEffect, useCallback } from 'react';
import { indexedDBManager, OfflineAction } from '@/lib/storage/indexedDB';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useOfflineSync = () => {
  const syncPendingActions = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const pendingActions = await indexedDBManager.getPendingActions();
      
      for (const action of pendingActions) {
        try {
          let success = false;
          
          switch (action.type) {
            case 'add_to_list':
              await handleAddToList(action);
              success = true;
              break;
            case 'update_progress':
              await handleUpdateProgress(action);
              success = true;
              break;
            case 'rate_title':
              await handleRateTitle(action);
              success = true;
              break;
            case 'write_review':
              await handleWriteReview(action);
              success = true;
              break;
            default:
              console.warn('Unknown action type:', action.type);
              success = true; // Remove unknown actions
          }
          
          if (success) {
            await indexedDBManager.removeOfflineAction(action.id);
          }
        } catch (error) {
          console.error('Error syncing action:', action.type, error);
          
          // Increment retry count
          await indexedDBManager.incrementRetryCount(action.id);
          
          // Remove action if it has failed too many times
          if (action.retry_count >= 3) {
            await indexedDBManager.removeOfflineAction(action.id);
            toast.error(`Failed to sync ${action.type} after 3 attempts`);
          }
        }
      }
      
      // Sync user list items
      const pendingListItems = await indexedDBManager.getPendingSyncItems();
      for (const item of pendingListItems) {
        try {
          // For now, just mark as synced since the exact table structure needs to be confirmed
          // This will be updated once user_lists table is properly set up
          await indexedDBManager.updateSyncStatus(item.id, 'synced');
          console.log('Offline sync: would sync user list item', item);
        } catch (error) {
          console.error('Error syncing list item:', error);
          await indexedDBManager.updateSyncStatus(item.id, 'failed');
        }
      }
      
    } catch (error) {
      console.error('Error during sync:', error);
    }
  }, []);

  const handleAddToList = async (action: OfflineAction) => {
    // Placeholder for add to list action - will be implemented once user_lists table is set up
    console.log('Offline sync: would add to list', action.data);
  };

  const handleUpdateProgress = async (action: OfflineAction) => {
    // Placeholder for update progress action - will be implemented once user_lists table is set up
    console.log('Offline sync: would update progress', action.data);
  };

  const handleRateTitle = async (action: OfflineAction) => {
    // Placeholder for rate title action - will be implemented once user_lists table is set up
    console.log('Offline sync: would rate title', action.data);
  };

  const handleWriteReview = async (action: OfflineAction) => {
    const { title_id, user_id, content, rating, spoiler_warning } = action.data;
    
    const { error } = await supabase
      .from('reviews')
      .insert({
        title_id,
        user_id,
        content,
        rating,
        spoiler_warning: spoiler_warning || false
      });
    
    if (error) throw error;
  };

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      syncPendingActions();
    };

    window.addEventListener('online', handleOnline);
    
    // Also sync on initial load if online
    if (navigator.onLine) {
      syncPendingActions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncPendingActions]);

  // Periodic sync when online
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncPendingActions();
      }
    }, 60000); // Sync every minute when online

    return () => clearInterval(interval);
  }, [syncPendingActions]);

  // Cleanup old data periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      indexedDBManager.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Daily cleanup

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    syncPendingActions
  };
};