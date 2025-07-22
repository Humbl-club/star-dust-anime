import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { animeService, mangaService, AnimeContent, MangaContent } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';

export interface InfiniteContentOptions {
  contentType: 'anime' | 'manga';
  limit?: number;
  search?: string;
  genre?: string;
  status?: string;
  type?: string;
  year?: string;
  season?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  useOptimized?: boolean;
}

export interface InfiniteContentReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  totalItems: number;
  currentItems: number;
  refetch: () => void;
}

// Overloaded function signatures for type safety
export function useInfiniteContentData(options: InfiniteContentOptions & { contentType: 'anime' }): InfiniteContentReturn<any>;
export function useInfiniteContentData(options: InfiniteContentOptions & { contentType: 'manga' }): InfiniteContentReturn<any>;

export function useInfiniteContentData(options: InfiniteContentOptions): InfiniteContentReturn<any> {
  const queryClient = useQueryClient();
  const {
    contentType,
    limit = 24,
    search,
    genre,
    status,
    type,
    year,
    season,
    sort_by = 'popularity',
    order = 'desc',
    useOptimized = false // Use service layer by default for simplicity
  } = options;

  const queryKey = [
    'infinite-content',
    contentType,
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

  const fetchPage = async ({ pageParam = 0 }) => {
    const startTime = performance.now();
    
    try {
      // Use service layer for simplicity and compatibility
      const queryOptions = {
        page: pageParam + 1,
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

      console.log(`🚀 Infinite ${contentType} fetch (page ${pageParam + 1}):`, queryOptions);

      const response = contentType === 'anime'
        ? await animeService.fetchAnimeOptimized(queryOptions)
        : await mangaService.fetchMangaOptimized(queryOptions);

      const endTime = performance.now();
      console.log(`✅ Infinite ${contentType} response (${Math.round(endTime - startTime)}ms):`, {
        success: response.success,
        page: pageParam + 1,
        count: response.data?.data?.length || 0,
        total: response.data?.pagination?.total
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch data');
      }

      return {
        data: response.data.data,
        nextCursor: response.data.pagination.has_next_page ? pageParam + 1 : undefined,
        total: response.data.pagination.total
      };
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ Infinite ${contentType} fetch error (${Math.round(endTime - startTime)}ms):`, error);
      throw error;
    }
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchPage,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2
  });

  // Flatten all pages into a single array
  const allItems = data?.pages.flatMap(page => page.data as any[]) || [];
  const totalItems = data?.pages[0]?.total || 0;

  return {
    data: allItems,
    loading: isFetching && !isFetchingNextPage,
    error: error as Error | null,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    totalItems,
    currentItems: allItems.length,
    refetch
  };
}