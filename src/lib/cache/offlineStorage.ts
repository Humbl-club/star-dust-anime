import { openDB, IDBPDatabase } from 'idb';

export interface CachedAnime {
  id: string;
  title: string;
  title_english?: string;
  title_japanese?: string;
  image_url?: string;
  synopsis?: string;
  score: number;
  episodes?: number;
  status?: string;
  aired_from?: string;
  aired_to?: string;
  genres?: string[];
  studios?: string[];
  cachedAt: number;
  type: 'anime';
}

export interface CachedManga {
  id: string;
  title: string;
  title_english?: string;
  title_japanese?: string;
  image_url?: string;
  synopsis?: string;
  score: number;
  chapters?: number;
  volumes?: number;
  status?: string;
  published_from?: string;
  published_to?: string;
  genres?: string[];
  authors?: string[];
  cachedAt: number;
  type: 'manga';
}

export interface CachedUserList {
  id: string;
  userId: string;
  titleId: string;
  titleType: 'anime' | 'manga';
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress?: number;
  score?: number;
  notes?: string;
  lastModified: number;
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  results: Array<{
    id: string;
    title: string;
    type: 'anime' | 'manga';
  }>;
}

class OfflineStorageManager {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'anithing-cache';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // Recently viewed content
          if (!db.objectStoreNames.contains('recentlyViewed')) {
            const store = db.createObjectStore('recentlyViewed', { keyPath: 'id' });
            store.createIndex('type', 'type');
            store.createIndex('cachedAt', 'cachedAt');
          }

          // User lists (for offline modifications)
          if (!db.objectStoreNames.contains('userLists')) {
            const store = db.createObjectStore('userLists', { keyPath: 'id' });
            store.createIndex('userId', 'userId');
            store.createIndex('titleId', 'titleId');
            store.createIndex('syncStatus', 'syncStatus');
          }

          // Search history
          if (!db.objectStoreNames.contains('searchHistory')) {
            const store = db.createObjectStore('searchHistory', { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp');
          }

          // Anime details cache
          if (!db.objectStoreNames.contains('animeCache')) {
            const store = db.createObjectStore('animeCache', { keyPath: 'id' });
            store.createIndex('cachedAt', 'cachedAt');
          }

          // Manga details cache
          if (!db.objectStoreNames.contains('mangaCache')) {
            const store = db.createObjectStore('mangaCache', { keyPath: 'id' });
            store.createIndex('cachedAt', 'cachedAt');
          }

          // Pending sync operations
          if (!db.objectStoreNames.contains('pendingSyncs')) {
            const store = db.createObjectStore('pendingSyncs', { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp');
            store.createIndex('operation', 'operation');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  // Recently viewed content
  async addRecentlyViewed(content: CachedAnime | CachedManga): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      const transaction = this.db.transaction('recentlyViewed', 'readwrite');
      const store = transaction.objectStore('recentlyViewed');
      
      await store.put({
        ...content,
        cachedAt: Date.now()
      });

      // Keep only the last 50 items
      const allItems = await store.getAll();
      if (allItems.length > 50) {
        const sortedItems = allItems.sort((a, b) => b.cachedAt - a.cachedAt);
        const itemsToDelete = sortedItems.slice(50);
        
        for (const item of itemsToDelete) {
          await store.delete(item.id);
        }
      }
    } catch (error) {
      console.error('Failed to add recently viewed:', error);
    }
  }

  async getRecentlyViewed(limit = 20): Promise<(CachedAnime | CachedManga)[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      const transaction = this.db.transaction('recentlyViewed', 'readonly');
      const store = transaction.objectStore('recentlyViewed');
      const index = store.index('cachedAt');
      
      const items = await index.getAll();
      return items
        .sort((a, b) => b.cachedAt - a.cachedAt)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get recently viewed:', error);
      return [];
    }
  }

  // Cache anime/manga details
  async cacheAnime(anime: CachedAnime): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      const transaction = this.db.transaction('animeCache', 'readwrite');
      await transaction.objectStore('animeCache').put({
        ...anime,
        cachedAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to cache anime:', error);
    }
  }

  async cacheManga(manga: CachedManga): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      const transaction = this.db.transaction('mangaCache', 'readwrite');
      await transaction.objectStore('mangaCache').put({
        ...manga,
        cachedAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to cache manga:', error);
    }
  }

  async getCachedAnime(id: string): Promise<CachedAnime | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    try {
      const transaction = this.db.transaction('animeCache', 'readonly');
      const result = await transaction.objectStore('animeCache').get(id);
      
      // Check if cache is fresh (within 24 hours)
      if (result && Date.now() - result.cachedAt < 24 * 60 * 60 * 1000) {
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached anime:', error);
      return null;
    }
  }

  async getCachedManga(id: string): Promise<CachedManga | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    try {
      const transaction = this.db.transaction('mangaCache', 'readonly');
      const result = await transaction.objectStore('mangaCache').get(id);
      
      // Check if cache is fresh (within 24 hours)
      if (result && Date.now() - result.cachedAt < 24 * 60 * 60 * 1000) {
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached manga:', error);
      return null;
    }
  }

  // User lists offline management
  async updateUserListOffline(listEntry: CachedUserList): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['userLists', 'pendingSyncs'], 'readwrite');
      
      // Update the list entry
      await transaction.objectStore('userLists').put({
        ...listEntry,
        lastModified: Date.now(),
        syncStatus: 'pending'
      });

      // Add to pending syncs
      await transaction.objectStore('pendingSyncs').put({
        id: `list_${listEntry.id}_${Date.now()}`,
        operation: 'update_list',
        data: listEntry,
        timestamp: Date.now(),
        retryCount: 0
      });
    } catch (error) {
      console.error('Failed to update user list offline:', error);
    }
  }

  async getUserLists(userId: string): Promise<CachedUserList[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      const transaction = this.db.transaction('userLists', 'readonly');
      const store = transaction.objectStore('userLists');
      const index = store.index('userId');
      
      return await index.getAll(userId);
    } catch (error) {
      console.error('Failed to get user lists:', error);
      return [];
    }
  }

  // Search history
  async addSearchHistory(query: string, results: SearchHistoryItem['results']): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      const transaction = this.db.transaction('searchHistory', 'readwrite');
      const store = transaction.objectStore('searchHistory');
      
      await store.put({
        id: `search_${Date.now()}`,
        query,
        results,
        timestamp: Date.now()
      });

      // Keep only the last 100 searches
      const allSearches = await store.getAll();
      if (allSearches.length > 100) {
        const sortedSearches = allSearches.sort((a, b) => b.timestamp - a.timestamp);
        const searchesToDelete = sortedSearches.slice(100);
        
        for (const search of searchesToDelete) {
          await store.delete(search.id);
        }
      }
    } catch (error) {
      console.error('Failed to add search history:', error);
    }
  }

  async getSearchHistory(limit = 10): Promise<SearchHistoryItem[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      const transaction = this.db.transaction('searchHistory', 'readonly');
      const store = transaction.objectStore('searchHistory');
      const index = store.index('timestamp');
      
      const items = await index.getAll();
      return items
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  // Pending syncs management
  async getPendingSyncs(): Promise<any[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      const transaction = this.db.transaction('pendingSyncs', 'readonly');
      const store = transaction.objectStore('pendingSyncs');
      
      return await store.getAll();
    } catch (error) {
      console.error('Failed to get pending syncs:', error);
      return [];
    }
  }

  async removePendingSync(id: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      const transaction = this.db.transaction('pendingSyncs', 'readwrite');
      await transaction.objectStore('pendingSyncs').delete(id);
    } catch (error) {
      console.error('Failed to remove pending sync:', error);
    }
  }

  async updateSyncStatus(listId: string, status: 'pending' | 'synced' | 'error'): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    try {
      const transaction = this.db.transaction('userLists', 'readwrite');
      const store = transaction.objectStore('userLists');
      
      const entry = await store.get(listId);
      if (entry) {
        entry.syncStatus = status;
        await store.put(entry);
      }
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }

  // Clear old cache data
  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    try {
      const transaction = this.db.transaction(['animeCache', 'mangaCache'], 'readwrite');
      
      // Clear expired anime cache
      const animeStore = transaction.objectStore('animeCache');
      const animeIndex = animeStore.index('cachedAt');
      const expiredAnime = await animeIndex.getAll(IDBKeyRange.upperBound(oneWeekAgo));
      
      for (const item of expiredAnime) {
        await animeStore.delete(item.id);
      }

      // Clear expired manga cache
      const mangaStore = transaction.objectStore('mangaCache');
      const mangaIndex = mangaStore.index('cachedAt');
      const expiredManga = await mangaIndex.getAll(IDBKeyRange.upperBound(oneWeekAgo));
      
      for (const item of expiredManga) {
        await mangaStore.delete(item.id);
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }
}

export const offlineStorage = new OfflineStorageManager();
