import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'AniThingDB';
const DB_VERSION = 1;

export interface AnimeData {
  id: string;
  title: string;
  image_url: string;
  synopsis: string;
  score: number;
  episodes?: number;
  status?: string;
  genres?: any[];
  studios?: any[];
  cached_at: number;
}

export interface MangaData {
  id: string;
  title: string;
  image_url: string;
  synopsis: string;
  score: number;
  chapters?: number;
  volumes?: number;
  status?: string;
  genres?: any[];
  authors?: any[];
  cached_at: number;
}

export interface UserListItem {
  id: string;
  title_id: string;
  user_id: string;
  status: string;
  media_type: 'anime' | 'manga';
  rating?: number;
  progress?: number;
  notes?: string;
  cached_at: number;
  sync_status: 'synced' | 'pending' | 'failed';
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  content_type: 'anime' | 'manga' | 'all';
  timestamp: number;
  results_count: number;
}

export interface OfflineAction {
  id: string;
  type: 'add_to_list' | 'update_progress' | 'rate_title' | 'write_review';
  data: any;
  timestamp: number;
  retry_count: number;
}

class IndexedDBManager {
  private db: IDBPDatabase | null = null;

  async initDB() {
    if (this.db) return this.db;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Anime store
        if (!db.objectStoreNames.contains('anime')) {
          const animeStore = db.createObjectStore('anime', { keyPath: 'id' });
          animeStore.createIndex('title', 'title');
          animeStore.createIndex('cached_at', 'cached_at');
        }

        // Manga store
        if (!db.objectStoreNames.contains('manga')) {
          const mangaStore = db.createObjectStore('manga', { keyPath: 'id' });
          mangaStore.createIndex('title', 'title');
          mangaStore.createIndex('cached_at', 'cached_at');
        }

        // User lists store
        if (!db.objectStoreNames.contains('user_lists')) {
          const listStore = db.createObjectStore('user_lists', { keyPath: 'id' });
          listStore.createIndex('user_id', 'user_id');
          listStore.createIndex('title_id', 'title_id');
          listStore.createIndex('sync_status', 'sync_status');
        }

        // Search history store
        if (!db.objectStoreNames.contains('search_history')) {
          const searchStore = db.createObjectStore('search_history', { keyPath: 'id' });
          searchStore.createIndex('timestamp', 'timestamp');
          searchStore.createIndex('query', 'query');
        }

        // Offline actions store
        if (!db.objectStoreNames.contains('offline_actions')) {
          const offlineStore = db.createObjectStore('offline_actions', { keyPath: 'id' });
          offlineStore.createIndex('timestamp', 'timestamp');
          offlineStore.createIndex('type', 'type');
        }
      },
    });

    return this.db;
  }

  // Anime operations
  async cacheAnime(anime: AnimeData) {
    const db = await this.initDB();
    await db.put('anime', { ...anime, cached_at: Date.now() });
  }

  async getCachedAnime(id: string): Promise<AnimeData | undefined> {
    const db = await this.initDB();
    return db.get('anime', id);
  }

  async getRecentAnime(limit = 20): Promise<AnimeData[]> {
    const db = await this.initDB();
    const tx = db.transaction('anime', 'readonly');
    const index = tx.store.index('cached_at');
    const items = await index.getAll();
    return items
      .sort((a, b) => b.cached_at - a.cached_at)
      .slice(0, limit);
  }

  // Manga operations
  async cacheManga(manga: MangaData) {
    const db = await this.initDB();
    await db.put('manga', { ...manga, cached_at: Date.now() });
  }

  async getCachedManga(id: string): Promise<MangaData | undefined> {
    const db = await this.initDB();
    return db.get('manga', id);
  }

  async getRecentManga(limit = 20): Promise<MangaData[]> {
    const db = await this.initDB();
    const tx = db.transaction('manga', 'readonly');
    const index = tx.store.index('cached_at');
    const items = await index.getAll();
    return items
      .sort((a, b) => b.cached_at - a.cached_at)
      .slice(0, limit);
  }

  // User list operations
  async cacheUserListItem(item: UserListItem) {
    const db = await this.initDB();
    await db.put('user_lists', { ...item, cached_at: Date.now() });
  }

  async getUserLists(userId: string): Promise<UserListItem[]> {
    const db = await this.initDB();
    const tx = db.transaction('user_lists', 'readonly');
    const index = tx.store.index('user_id');
    return index.getAll(userId);
  }

  async getPendingSyncItems(): Promise<UserListItem[]> {
    const db = await this.initDB();
    const tx = db.transaction('user_lists', 'readonly');
    const index = tx.store.index('sync_status');
    return index.getAll('pending');
  }

  async updateSyncStatus(id: string, status: 'synced' | 'pending' | 'failed') {
    const db = await this.initDB();
    const item = await db.get('user_lists', id);
    if (item) {
      item.sync_status = status;
      await db.put('user_lists', item);
    }
  }

  // Search history operations
  async addSearchHistory(query: string, contentType: 'anime' | 'manga' | 'all', resultsCount: number) {
    const db = await this.initDB();
    const item: SearchHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      query,
      content_type: contentType,
      timestamp: Date.now(),
      results_count: resultsCount
    };
    await db.put('search_history', item);

    // Keep only last 100 searches
    const tx = db.transaction('search_history', 'readwrite');
    const index = tx.store.index('timestamp');
    const all = await index.getAll();
    if (all.length > 100) {
      const toDelete = all
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, all.length - 100);
      
      for (const item of toDelete) {
        await tx.store.delete(item.id);
      }
    }
  }

  async getSearchHistory(limit = 20): Promise<SearchHistoryItem[]> {
    const db = await this.initDB();
    const tx = db.transaction('search_history', 'readonly');
    const index = tx.store.index('timestamp');
    const items = await index.getAll();
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Offline actions operations
  async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retry_count'>) {
    const db = await this.initDB();
    const offlineAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retry_count: 0
    };
    await db.put('offline_actions', offlineAction);
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    const db = await this.initDB();
    const tx = db.transaction('offline_actions', 'readonly');
    const index = tx.store.index('timestamp');
    return index.getAll();
  }

  async removeOfflineAction(id: string) {
    const db = await this.initDB();
    await db.delete('offline_actions', id);
  }

  async incrementRetryCount(id: string) {
    const db = await this.initDB();
    const action = await db.get('offline_actions', id);
    if (action) {
      action.retry_count += 1;
      await db.put('offline_actions', action);
    }
  }

  // Cleanup operations
  async cleanupOldData() {
    const db = await this.initDB();
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

    // Clean old anime cache
    const animeTx = db.transaction('anime', 'readwrite');
    const animeIndex = animeTx.store.index('cached_at');
    const oldAnime = await animeIndex.getAll(IDBKeyRange.upperBound(cutoffTime));
    for (const item of oldAnime) {
      await animeTx.store.delete(item.id);
    }

    // Clean old manga cache
    const mangaTx = db.transaction('manga', 'readwrite');
    const mangaIndex = mangaTx.store.index('cached_at');
    const oldManga = await mangaIndex.getAll(IDBKeyRange.upperBound(cutoffTime));
    for (const item of oldManga) {
      await mangaTx.store.delete(item.id);
    }

    // Clean old search history
    const searchTx = db.transaction('search_history', 'readwrite');
    const searchIndex = searchTx.store.index('timestamp');
    const oldSearches = await searchIndex.getAll(IDBKeyRange.upperBound(cutoffTime));
    for (const item of oldSearches) {
      await searchTx.store.delete(item.id);
    }
  }
}

export const indexedDBManager = new IndexedDBManager();
