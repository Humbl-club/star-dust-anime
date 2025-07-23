import { useEffect, useCallback } from 'react';
import { indexedDBManager } from '@/lib/storage/indexedDB';
import { toast } from 'sonner';
import { SyncResult, OfflineAction } from '@/types/userLists';
import { 
  handleAddToList, 
  handleUpdateProgress, 
  handleRateTitle, 
  handleWriteReview,
  handleUpdateStatus,
  handleUpdateNotes,
  syncUserTitleListItem
} from '@/lib/sync/syncHandlers';

export const useOfflineSync = () => {
  const syncPendingActions = useCallback(async (): Promise<SyncResult> => {
    if (!navigator.onLine) {
      return { success: false, synced_count: 0, failed_count: 0, errors: [] };
    }

    const result: SyncResult = {
      success: true,
      synced_count: 0,
      failed_count: 0,
      errors: []
    };

    try {
      const pendingActions = await indexedDBManager.getPendingActions();
      
      for (const action of pendingActions) {
        try {
          await syncAction(action);
          await indexedDBManager.removeOfflineAction(action.id);
          result.synced_count++;
        } catch (error) {
          console.error('Error syncing action:', action.type, error);
          
          // Increment retry count
          await indexedDBManager.incrementRetryCount(action.id);
          
          // Remove action if it has failed too many times
          if (action.retry_count >= 3) {
            await indexedDBManager.removeOfflineAction(action.id);
            toast.error(`Failed to sync ${action.type} after 3 attempts`);
            
            result.errors.push({
              action_id: action.id,
              error_message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: Date.now(),
              retry_count: action.retry_count
            });
          }
          
          result.failed_count++;
          result.success = false;
        }
      }
      
      // Sync user list items
      const pendingListItems = await indexedDBManager.getPendingSyncItems();
      for (const item of pendingListItems) {
        try {
          const syncResult = await syncUserTitleListItem(item);
          if (syncResult.success) {
            await indexedDBManager.updateSyncStatus(item.id, 'synced');
            result.synced_count++;
          } else {
            await indexedDBManager.updateSyncStatus(item.id, 'failed');
            result.failed_count++;
            result.success = false;
          }
        } catch (error) {
          console.error('Error syncing list item:', error);
          await indexedDBManager.updateSyncStatus(item.id, 'failed');
          result.failed_count++;
          result.success = false;
        }
      }
      
    } catch (error) {
      console.error('Error during sync:', error);
      result.success = false;
    }

    return result;
  }, []);

  const syncAction = async (action: any) => {
    switch (action.type) {
      case 'add_to_list':
        return handleAddToList(action as OfflineAction<'add_to_list'>);
      case 'update_progress':
        return handleUpdateProgress(action as OfflineAction<'update_progress'>);
      case 'rate_title':
        return handleRateTitle(action as OfflineAction<'rate_title'>);
      case 'write_review':
        return handleWriteReview(action as OfflineAction<'write_review'>);
      case 'update_status':
        return handleUpdateStatus(action as OfflineAction<'update_status'>);
      case 'update_notes':
        return handleUpdateNotes(action as OfflineAction<'update_notes'>);
      default:
        console.warn('Unknown action type:', (action as any).type);
        return Promise.resolve(); // Resolve unknown actions to remove them
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      const result = await syncPendingActions();
      if (result.synced_count > 0) {
        toast.success(`Synced ${result.synced_count} pending changes`);
      }
      if (result.failed_count > 0) {
        toast.warning(`Failed to sync ${result.failed_count} changes`);
      }
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