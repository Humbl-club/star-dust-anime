import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SyncQueueItem {
  id: string;
  action: 'add' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export function useBackgroundSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Load existing queue from localStorage
    const savedQueue = localStorage.getItem('sync-queue');
    if (savedQueue) {
      setSyncQueue(JSON.parse(savedQueue));
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      processSyncQueue();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register background sync if service worker is available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if ('sync' in registration) {
          // Background sync is supported
          console.log('Background sync is supported');
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sync-queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  const addToSyncQueue = (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>) => {
    const queueItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0
    };

    setSyncQueue(prev => [...prev, queueItem]);

    // Try to sync immediately if online
    if (isOnline) {
      processSyncQueue();
    }

    // Register for background sync if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if ('sync' in registration) {
          return (registration as any).sync.register('background-sync');
        }
      });
    }
  };

  const processSyncQueue = async () => {
    if (isSyncing || !isOnline || syncQueue.length === 0) return;

    setIsSyncing(true);

    try {
      const itemsToSync = [...syncQueue];
      const succeededItems: string[] = [];

      for (const item of itemsToSync) {
        try {
          await syncItem(item);
          succeededItems.push(item.id);
        } catch (error) {
          console.error('Sync failed for item:', item, error);
          
          // Increment retry count
          setSyncQueue(prev => 
            prev.map(queueItem => 
              queueItem.id === item.id 
                ? { ...queueItem, retryCount: queueItem.retryCount + 1 }
                : queueItem
            )
          );
        }
      }

      // Remove successfully synced items
      setSyncQueue(prev => prev.filter(item => !succeededItems.includes(item.id)));

      // Remove items that have failed too many times
      setSyncQueue(prev => prev.filter(item => item.retryCount < 3));

    } finally {
      setIsSyncing(false);
    }
  };

  const syncItem = async (item: SyncQueueItem) => {
    const { action, table, data } = item;

    switch (action) {
      case 'add':
        await supabase.from(table).insert(data);
        break;
      case 'update':
        await supabase.from(table).update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from(table).delete().eq('id', data.id);
        break;
    }

    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: [table] });
  };

  // Offline actions for user lists
  const addToListOffline = (titleId: string, status: string) => {
    addToSyncQueue({
      action: 'add',
      table: 'user_list_items',
      data: {
        title_id: titleId,
        status,
        added_at: new Date().toISOString()
      }
    });
  };

  const updateListItemOffline = (itemId: string, data: any) => {
    addToSyncQueue({
      action: 'update',
      table: 'user_list_items',
      data: { id: itemId, ...data }
    });
  };

  const removeFromListOffline = (itemId: string) => {
    addToSyncQueue({
      action: 'delete',
      table: 'user_list_items',
      data: { id: itemId }
    });
  };

  return {
    isOnline,
    syncQueue,
    isSyncing,
    queueSize: syncQueue.length,
    addToListOffline,
    updateListItemOffline,
    removeFromListOffline,
    processSyncQueue
  };
}