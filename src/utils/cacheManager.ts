import { QueryClient } from '@tanstack/react-query';

// Advanced caching utilities
export class CacheManager {
  private static instance: CacheManager;
  private queryClient: QueryClient;
  private prefetchQueue: Map<string, number> = new Map();
  private cacheHitRatio = { hits: 0, misses: 0 };

  private constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  static getInstance(queryClient: QueryClient): CacheManager {
    if (!this.instance) {
      this.instance = new CacheManager(queryClient);
    }
    return this.instance;
  }

  // Intelligent prefetching based on user behavior
  async prefetchContent(contentType: 'anime' | 'manga', options: any) {
    const cacheKey = `prefetch:${contentType}:${JSON.stringify(options)}`;
    
    // Avoid duplicate prefetches
    if (this.prefetchQueue.has(cacheKey)) return;
    
    this.prefetchQueue.set(cacheKey, Date.now());
    
    try {
      await this.queryClient.prefetchQuery({
        queryKey: ['content', contentType, options],
        queryFn: () => this.fetchContentData(contentType, options),
        staleTime: 10 * 60 * 1000, // 10 minutes for prefetched data
      });
      
      console.log(`✅ Prefetched ${contentType} data:`, options);
    } catch (error) {
      console.error(`❌ Prefetch failed for ${contentType}:`, error);
    } finally {
      // Clean up queue entry after 5 minutes
      setTimeout(() => {
        this.prefetchQueue.delete(cacheKey);
      }, 5 * 60 * 1000);
    }
  }

  // Cache warming for popular content
  async warmCache() {
    console.log('🔥 Starting cache warming...');
    
    const popularQueries = [
      { contentType: 'anime', sort_by: 'popularity', limit: 24 },
      { contentType: 'anime', sort_by: 'score', limit: 24 },
      { contentType: 'manga', sort_by: 'popularity', limit: 24 },
      { contentType: 'manga', sort_by: 'score', limit: 24 },
    ];

    const warmPromises = popularQueries.map(query => 
      this.prefetchContent(query.contentType as 'anime' | 'manga', query)
    );

    await Promise.allSettled(warmPromises);
    console.log('✅ Cache warming completed');
  }

  // Predictive prefetching based on hover
  async prefetchOnHover(contentId: string, contentType: 'anime' | 'manga', delay = 500) {
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        try {
          await this.queryClient.prefetchQuery({
            queryKey: ['content-detail', contentType, contentId],
            queryFn: () => this.fetchContentDetail(contentType, contentId),
            staleTime: 15 * 60 * 1000, // 15 minutes for detail pages
          });
          console.log(`✅ Prefetched ${contentType} detail:`, contentId);
          resolve();
        } catch (error) {
          console.error(`❌ Detail prefetch failed:`, error);
          resolve();
        }
      }, delay);
    });
  }

  // Cache hit ratio tracking
  trackCacheHit(isHit: boolean) {
    if (isHit) {
      this.cacheHitRatio.hits++;
    } else {
      this.cacheHitRatio.misses++;
    }
  }

  getCacheStats() {
    const total = this.cacheHitRatio.hits + this.cacheHitRatio.misses;
    const ratio = total > 0 ? (this.cacheHitRatio.hits / total * 100).toFixed(2) : '0';
    
    return {
      hits: this.cacheHitRatio.hits,
      misses: this.cacheHitRatio.misses,
      ratio: `${ratio}%`,
      total
    };
  }

  // Smart cache invalidation
  invalidateContentCache(contentType?: 'anime' | 'manga', specific?: string) {
    if (specific) {
      // Invalidate specific content
      this.queryClient.invalidateQueries({
        queryKey: ['content-detail', contentType, specific]
      });
    } else if (contentType) {
      // Invalidate all content of a type
      this.queryClient.invalidateQueries({
        queryKey: ['content', contentType]
      });
    } else {
      // Invalidate all content cache
      this.queryClient.invalidateQueries({
        queryKey: ['content']
      });
    }
  }

  // Optimistic updates for user actions
  async optimisticUpdate<T>(
    queryKey: any[],
    updater: (old: T | undefined) => T,
    mutationFn: () => Promise<T>
  ) {
    // Cancel any outgoing refetches
    await this.queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousData = this.queryClient.getQueryData<T>(queryKey);

    // Optimistically update
    this.queryClient.setQueryData(queryKey, updater);

    try {
      // Perform the actual mutation
      const result = await mutationFn();
      
      // Update with real data
      this.queryClient.setQueryData(queryKey, result);
      
      return result;
    } catch (error) {
      // Rollback on error
      this.queryClient.setQueryData(queryKey, previousData);
      throw error;
    }
  }

  // Private helper methods
  private async fetchContentData(contentType: string, options: any) {
    // This would call your actual API
    const { data } = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType, ...options })
    }).then(r => r.json());
    
    return data;
  }

  private async fetchContentDetail(contentType: string, id: string) {
    const { data } = await fetch(`/api/content/${contentType}/${id}`)
      .then(r => r.json());
    
    return data;
  }
}

// Background sync worker
export class BackgroundSync {
  private static instance: BackgroundSync;
  private syncInterval: number | null = null;
  private queryClient: QueryClient;

  private constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  static getInstance(queryClient: QueryClient): BackgroundSync {
    if (!this.instance) {
      this.instance = new BackgroundSync(queryClient);
    }
    return this.instance;
  }

  startBackgroundSync(interval = 5 * 60 * 1000) {
    if (this.syncInterval) return;

    this.syncInterval = window.setInterval(() => {
      this.performBackgroundSync();
    }, interval);

    console.log('🔄 Background sync started');
  }

  stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏸️ Background sync stopped');
    }
  }

  private async performBackgroundSync() {
    // Only sync if user is active (not idle)
    if (document.hidden) return;

    try {
      // Refresh stale queries in background
      await this.queryClient.refetchQueries({
        type: 'active',
        stale: true,
      });

      console.log('🔄 Background sync completed');
    } catch (error) {
      console.error('❌ Background sync failed:', error);
    }
  }
}