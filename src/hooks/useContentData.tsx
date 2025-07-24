import { useQuery, useQueryClient } from '@tanstack/react-query';
import { animeService, mangaService, AnimeContent, MangaContent } from '@/services/api';
import { queryKeys } from '@/utils/queryKeys';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface UseContentDataOptions {
  contentType: 'anime' | 'manga';
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  status?: string;
  type?: string;
  year?: string;
  season?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  autoFetch?: boolean;
  useOptimized?: boolean; // Toggle between edge function vs direct DB
  useEdgeCache?: boolean; // Use edge function for aggregated home data
}

export interface UseContentDataReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationInfo | null;
  refetch: () => Promise<void>;
  syncFromExternal: (pages?: number) => Promise<void>;
  syncImages?: (limit?: number) => Promise<void>;
  clearCache: () => void;
}

// Overloaded function signatures for type safety
export function useContentData(options: UseContentDataOptions & { contentType: 'anime' }): UseContentDataReturn<AnimeContent>;
export function useContentData(options: UseContentDataOptions & { contentType: 'manga' }): UseContentDataReturn<MangaContent>;

// Implementation
export function useContentData(options: UseContentDataOptions): UseContentDataReturn<AnimeContent | MangaContent> {
  const queryClient = useQueryClient();
  const {
    contentType,
    page = 1,
    limit = 20,
    search,
    genre,
    status,
    type,
    year,
    season,
    sort_by = 'score',
    order = 'desc',
    autoFetch = true,
    useOptimized = true,
    useEdgeCache = false
  } = options;

  // Create query key for caching
  const queryKey = [
    'content',
    contentType, 
    page, 
    limit, 
    search, 
    genre, 
    status, 
    type, 
    year, 
    season, 
    sort_by, 
    order,
    useOptimized ? 'optimized' : 'api',
    useEdgeCache ? 'edge-cache' : 'normal'
  ];

  // Query function that uses either optimized DB calls or edge function
  const queryFn = async () => {
    // Clean options to remove undefined values
    const queryOptions = {
      page,
      limit,
      ...(search && { search }),
      ...(genre && { genre }),
      ...(status && { status }),
      ...(type && { type }),
      ...(year && { year }),
      ...(season && { season }),
      sort_by,
      order
    };

    logger.debug('🔍 useContentData: Starting query with options:', {
      contentType,
      useOptimized,
      useEdgeCache,
      functionName: useEdgeCache ? 'edge-cache' : (useOptimized ? 'direct-db-query' : 'anime-api'),
      queryOptions,
      timestamp: new Date().toISOString()
    });

    const startTime = performance.now();

    try {
      // Use edge cache for home page aggregated data
      if (useEdgeCache && contentType === 'anime' && page === 1 && !search && !genre && !status && !type && !year && !season) {
        logger.debug('🏠 useContentData: Using edge cached home data...');
        
        const { data: cachedData, error } = await supabase.functions.invoke('cached-home-data', {
          body: {
            contentType: contentType,
            sections: ['trending', 'recent', 'topRated']
          }
        });
        
        if (error) {
          console.warn('⚠️ useContentData: Edge cache failed, falling back to direct query:', error);
        } else if (cachedData?.success) {
          const endTime = performance.now();
          logger.debug(`✅ useContentData: Edge cached response (${Math.round(endTime - startTime)}ms):`, {
            success: true,
            totalItems: (cachedData.data.trending?.length || 0) + (cachedData.data.recent?.length || 0) + (cachedData.data.topRated?.length || 0)
          });
          
          // Aggregate all sections into a single data array
          const allData = [
            ...(cachedData.data.trending || []),
            ...(cachedData.data.recent || []),
            ...(cachedData.data.topRated || [])
          ];
          
          // Remove duplicates based on id
          const uniqueData = Array.from(
            new Map(allData.map(item => [item.id, item])).values()
          );
          
          // Transform edge cache data to match expected format
          return {
            data: uniqueData.slice(0, limit),
            pagination: {
              current_page: 1,
              per_page: uniqueData.length,
              total: uniqueData.length,
              total_pages: 1,
              has_next_page: false,
              has_prev_page: false
            }
          };
        }
      }

      if (useOptimized) {
        // Use optimized direct database queries
        logger.debug(`🚀 useContentData: Calling optimized ${contentType} service...`);
        const response = contentType === 'anime'
          ? await animeService.fetchAnimeOptimized(queryOptions)
          : await mangaService.fetchMangaOptimized(queryOptions);

        const endTime = performance.now();
        logger.debug(`✅ useContentData: Optimized ${contentType} response (${Math.round(endTime - startTime)}ms):`, {
          success: response.success,
          dataLength: response.data?.data?.length || 0,
          error: response.error,
          pagination: response.data?.pagination,
          rawResponse: response
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch data');
        }
        return response.data;
      } else {
        // Use edge function API
        logger.debug(`🌐 useContentData: Calling edge function for ${contentType}...`);
        const response = contentType === 'anime'
          ? await animeService.fetchAnime(queryOptions)
          : await mangaService.fetchManga(queryOptions);

        const endTime = performance.now();
        logger.debug(`🌐 useContentData: Edge function ${contentType} response (${Math.round(endTime - startTime)}ms):`, {
          success: response.success,
          dataLength: response.data?.data?.length || 0,
          error: response.error,
          pagination: response.data?.pagination,
          rawResponse: response
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch data');
        }
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ useContentData: Error fetching ${contentType} data (${Math.round(endTime - startTime)}ms):`, {
        error: error.message,
        stack: error.stack,
        queryOptions,
        useOptimized,
        contentType,
        fullError: error
      });
      throw error;
    }
  };

  // React Query hook
  const {
    data: queryResult,
    isLoading: loading,
    error,
    refetch: queryRefetch
  } = useQuery({
    queryKey,
    queryFn,
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Refetch function
  const refetch = async () => {
    await queryRefetch();
  };

  // Clear React Query cache function
  const clearCache = () => {
    queryClient.clear();
    logger.debug('useContentData: React Query cache cleared');
  };

  // Sync from external API
  const syncFromExternal = async (pages = 1) => {
    const response = contentType === 'anime'
      ? await animeService.syncAnime(pages)
      : await mangaService.syncManga(pages);

    if (response.success) {
      // Use specific invalidation instead of broad invalidation
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.content.lists(),
        predicate: (query) => query.queryKey[2] === contentType
      });
    } else {
      throw new Error(response.error || 'Sync failed');
    }
  };

  // Sync images (optional feature)
  const syncImages = async (limit = 10) => {
    const response = contentType === 'anime'
      ? await animeService.syncAnimeImages(limit)
      : await mangaService.syncMangaImages(limit);

    if (response.success) {
      // Use specific invalidation for image updates
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.content.lists(),
        predicate: (query) => query.queryKey[2] === contentType
      });
    } else {
      throw new Error(response.error || 'Image sync failed');
    }
  };

  // Log final return data
  logger.debug(`📊 useContentData: Final return data for ${contentType}:`, {
    dataLength: queryResult?.data?.length || 0,
    loading,
    error: error?.message,
    pagination: queryResult?.pagination,
    timestamp: new Date().toISOString()
  });

  return {
    data: queryResult?.data || [],
    loading,
    error: error as Error | null,
    pagination: queryResult?.pagination || null,
    refetch,
    syncFromExternal,
    syncImages,
    clearCache
  };
}