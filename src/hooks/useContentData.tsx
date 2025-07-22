import { useQuery, useQueryClient } from '@tanstack/react-query';
import { animeService, mangaService, AnimeContent, MangaContent } from '@/services/api';
import { queryKeys } from '@/utils/queryKeys';

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
    useOptimized = true
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
    useOptimized ? 'optimized' : 'api'
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

    console.log('useContentData: Fetching data with options:', {
      contentType,
      useOptimized,
      functionName: useOptimized ? 'direct-db-query' : 'anime-api',
      queryOptions,
      timestamp: new Date().toISOString()
    });

    const startTime = performance.now();

    try {
      if (useOptimized) {
        // Use optimized direct database queries
        console.log(`useContentData: Calling optimized ${contentType} service...`);
        const response = contentType === 'anime'
          ? await animeService.fetchAnimeOptimized(queryOptions)
          : await mangaService.fetchMangaOptimized(queryOptions);

        const endTime = performance.now();
        console.log(`useContentData: Optimized ${contentType} response (${Math.round(endTime - startTime)}ms):`, {
          success: response.success,
          dataLength: response.data?.data?.length || 0,
          error: response.error,
          pagination: response.data?.pagination
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch data');
        }
        return response.data;
      } else {
        // Use edge function API
        console.log(`useContentData: Calling edge function for ${contentType}...`);
        const response = contentType === 'anime'
          ? await animeService.fetchAnime(queryOptions)
          : await mangaService.fetchManga(queryOptions);

        const endTime = performance.now();
        console.log(`useContentData: Edge function ${contentType} response (${Math.round(endTime - startTime)}ms):`, {
          success: response.success,
          dataLength: response.data?.data?.length || 0,
          error: response.error,
          pagination: response.data?.pagination
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
      console.error(`useContentData: Error fetching ${contentType} data (${Math.round(endTime - startTime)}ms):`, {
        error: error.message,
        stack: error.stack,
        queryOptions,
        useOptimized,
        contentType
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
    console.log('useContentData: React Query cache cleared');
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