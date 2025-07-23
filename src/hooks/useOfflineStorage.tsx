import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PendingUpdate {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
}

export const useOfflineStorage = () => {
  const openDB = useCallback(() => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('anithing-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('pendingUpdates')) {
          db.createObjectStore('pendingUpdates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cachedData')) {
          db.createObjectStore('cachedData', { keyPath: 'key' });
        }
      };
    });
  }, []);
  
  const queueUpdate = useCallback(async (update: Omit<PendingUpdate, 'id' | 'timestamp'>) => {
    const db = await openDB();
    const tx = db.transaction('pendingUpdates', 'readwrite');
    const store = tx.objectStore('pendingUpdates');
    
    await store.add({
      ...update,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    });
    
    // Request background sync
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await (registration as any).sync.register('sync-user-lists');
        }
      } catch (error) {
        console.warn('Background sync not available:', error);
      }
    }
  }, [openDB]);
  
  const cacheData = useCallback(async (key: string, data: any) => {
    const db = await openDB();
    const tx = db.transaction('cachedData', 'readwrite');
    const store = tx.objectStore('cachedData');
    
    await store.put({
      key,
      data,
      timestamp: Date.now()
    });
  }, [openDB]);
  
  const getCachedData = useCallback(async (key: string) => {
    try {
      const db = await openDB();
      const tx = db.transaction('cachedData', 'readonly');
      const store = tx.objectStore('cachedData');
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result?.data || null);
      });
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }, [openDB]);
  
  // Wrapper for Supabase calls with offline support
  const offlineQuery = useCallback(async <T,>(
    key: string,
    queryFn: () => Promise<T>
  ): Promise<T | null> => {
    if (navigator.onLine) {
      try {
        const data = await queryFn();
        await cacheData(key, data);
        return data;
      } catch (error) {
        // Fallback to cache if online query fails
        return getCachedData(key) as Promise<T | null>;
      }
    } else {
      // Offline - return cached data
      return getCachedData(key) as Promise<T | null>;
    }
  }, [cacheData, getCachedData]);
  
  return {
    queueUpdate,
    cacheData,
    getCachedData,
    offlineQuery
  };
};