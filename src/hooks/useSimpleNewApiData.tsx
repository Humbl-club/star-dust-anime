import { useQuery, useQueryClient } from '@tanstack/react-query';
import { animeService, mangaService, AnimeContent, MangaContent } from '@/services/api';

interface UseSimpleNewApiDataOptions {
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
}

// Direct database query function using services
const fetchTitlesData = async (options: UseSimpleNewApiDataOptions): Promise<{ data: any[], pagination: any }> => {
  const { contentType } = options;

  const response = contentType === 'anime'
    ? await animeService.fetchAnimeOptimized(options)
    : await mangaService.fetchMangaOptimized(options);

  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch data');
  }

  return response.data;
};

// Overload declarations for proper TypeScript typing
export function useSimpleNewApiData(options: UseSimpleNewApiDataOptions & { contentType: 'anime' }): {
  data: AnimeContent[];
  pagination: any;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  syncFromExternal: (pages?: number) => Promise<void>;
  refetch: () => Promise<any>;
};

export function useSimpleNewApiData(options: UseSimpleNewApiDataOptions & { contentType: 'manga' }): {
  data: MangaContent[];
  pagination: any;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  syncFromExternal: (pages?: number) => Promise<void>;
  refetch: () => Promise<any>;
};

// Implementation
export function useSimpleNewApiData(options: UseSimpleNewApiDataOptions) {
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
    autoFetch = true
  } = options;

  // Create a stable query key for caching
  const queryKey = [
    'titles', 
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
    order
  ];

  // Use React Query with smart caching
  const {
    data: queryResult,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => fetchTitlesData(options),
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Sync from external API function using services
  const syncFromExternal = async (pages = 1) => {
    try {
      const response = contentType === 'anime'
        ? await animeService.syncAnime(pages)
        : await mangaService.syncManga(pages);

      if (response.success) {
        // Invalidate all title queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['titles'] });
      } else {
        throw new Error(response.error || 'Sync failed');
      }
    } catch (err: any) {
      console.error(`Error syncing ${contentType}:`, err);
      throw err;
    }
  };

  // Manual fetch function for compatibility
  const fetchData = async () => {
    await refetch();
  };

  return {
    data: queryResult?.data || [],
    pagination: queryResult?.pagination || null,
    loading,
    error: error?.message || null,
    fetchData,
    syncFromExternal,
    refetch
  };
}