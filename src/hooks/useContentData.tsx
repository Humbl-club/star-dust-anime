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

  const queryFn = async () => {
    // Clean and validate options (declared outside try block for error logging)
    const queryOptions = {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      ...(search && search.trim() && { search: search.trim() }),
      ...(genre && genre !== 'all' && { genre }),
      ...(status && status !== 'all' && { status }),
      ...(type && type !== 'all' && { type }),
      ...(year && year !== 'all' && { year }),
      ...(season && season !== 'all' && { season }),
      sort_by: sort_by || 'score',
      order: order || 'desc'
    };

    try {
      const startTime = performance.now();
      logger.debug(`🔍 useContentData: Starting ${contentType} query`, {
        queryOptions,
        useOptimized,
        useEdgeCache
      });

      let response;
      
      if (useOptimized) {
        // Use optimized direct database queries via service
        logger.debug(`🚀 useContentData: Calling optimized ${contentType} service...`);
        response = contentType === 'anime'
          ? await animeService.fetchAnimeOptimized(queryOptions)
          : await mangaService.fetchMangaOptimized(queryOptions);

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch data');
        }
      } else {
        // Use edge function
        response = contentType === 'anime'
          ? await animeService.fetchAnime(queryOptions)
          : await mangaService.fetchManga(queryOptions);
      }

      const endTime = performance.now();
      logger.debug(`✅ useContentData: ${contentType} query completed in ${Math.round(endTime - startTime)}ms`, {
        dataLength: response.data?.data?.length || 0
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch data');
      }

      return response.data;
    } catch (error) {
      logger.error(`❌ useContentData: Error fetching ${contentType}:`, error);
      throw error;
    }
  };

  // React Query hook
  const {
    data: queryResult,
    isLoading: loading,
    error,
    refetch: queryRefetch,
    isRefetching
  } = useQuery({
    queryKey,
    queryFn,
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Only retry on network errors, not on empty results
      if (error?.message?.includes('empty')) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    meta: {
      errorMessage: `Failed to load ${contentType}. Please check your connection and try again.`
    }
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