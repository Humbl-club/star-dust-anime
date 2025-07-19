import { useQuery, useQueryClient } from '@tanstack/react-query';
import { animeService, mangaService, AnimeContent, MangaContent } from '@/services/api';

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

    if (useOptimized) {
      // Use optimized direct database queries
      const response = contentType === 'anime'
        ? await animeService.fetchAnimeOptimized(queryOptions)
        : await mangaService.fetchMangaOptimized(queryOptions);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch data');
      }
      return response.data;
    } else {
      // Use edge function API
      const response = contentType === 'anime'
        ? await animeService.fetchAnime(queryOptions)
        : await mangaService.fetchManga(queryOptions);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch data');
      }
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
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

  // Sync from external API
  const syncFromExternal = async (pages = 1) => {
    const response = contentType === 'anime'
      ? await animeService.syncAnime(pages)
      : await mangaService.syncManga(pages);

    if (response.success) {
      queryClient.invalidateQueries({ queryKey: ['content', contentType] });
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
      queryClient.invalidateQueries({ queryKey: ['content', contentType] });
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
    syncImages
  };
}