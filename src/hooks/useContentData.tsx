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
  filters?: {
    search?: string;
    genre?: string;
    status?: string;
    type?: string;
    year?: string;
    season?: string;
    sort_by?: string;
    order?: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
  autoFetch?: boolean;
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
    filters = {},
    page = 1,
    limit = 20,
    autoFetch = true
  } = options;

  const {
    search,
    genre,
    status,
    type,
    year,
    season,
    sort_by = 'score',
    order = 'desc'
  } = filters;

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
    order
  ];

  const queryFn = async () => {
    const startTime = performance.now();
    
    try {
      logger.debug(`🔍 useContentData: Direct Supabase query for ${contentType}:`, {
        page, limit, search, genre, status, type, year, season, sort_by, order
      });

      // Build the base query with proper select statement
      const baseSelect = `
        *,
        ${contentType === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
        title_genres(genres(name)),
        ${contentType === 'anime' ? 'title_studios(studios(name))' : 'title_authors(authors(name))'}
      `;

      const genreSelect = `
        *,
        ${contentType === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
        title_genres!inner(genres!inner(name)),
        ${contentType === 'anime' ? 'title_studios(studios(name))' : 'title_authors(authors(name))'}
      `;

      let query = supabase
        .from('titles')
        .select(genre && genre !== 'all' ? genreSelect : baseSelect);

      // Apply genre filter using inner join
      if (genre && genre !== 'all') {
        query = query.eq('title_genres.genres.name', genre);
      }

      // Apply year filter
      if (year && year !== 'all') {
        query = query.eq('year', parseInt(year));
      }

      // Apply status filter
      if (status && status !== 'all') {
        const statusColumn = contentType === 'anime' ? 'anime_details.status' : 'manga_details.status';
        query = query.eq(statusColumn, status);
      }

      // Apply type filter
      if (type && type !== 'all') {
        const typeColumn = contentType === 'anime' ? 'anime_details.type' : 'manga_details.type';
        query = query.eq(typeColumn, type);
      }

      // Apply season filter (anime only)
      if (contentType === 'anime' && season && season !== 'all') {
        query = query.eq('anime_details.season', season);
      }

      // Apply search filter across multiple fields
      if (search && search.trim()) {
        const searchTerm = search.trim();
        query = query.or(`title.ilike.%${searchTerm}%,title_english.ilike.%${searchTerm}%,title_japanese.ilike.%${searchTerm}%`);
      }

      // Apply sorting with proper null handling
      const sortColumn = sort_by || 'score';
      const sortOrder = order || 'desc';
      
      if (sortColumn === 'score') {
        query = query.order(sortColumn, { 
          ascending: sortOrder === 'asc', 
          nullsFirst: false 
        });
      } else {
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        logger.error('❌ useContentData Supabase error:', error);
        throw error;
      }

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      logger.debug(`✅ useContentData completed in ${duration}ms:`, {
        contentType,
        itemsReturned: data?.length || 0,
        totalCount: count
      });

      // Calculate pagination info
      const totalCount = count || data?.length || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: (data || []) as unknown as (AnimeContent | MangaContent)[],
        pagination: {
          current_page: page,
          per_page: limit,
          total: totalCount,
          total_pages: totalPages,
          has_next_page: page < totalPages,
          has_prev_page: page > 1
        }
      };

    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      logger.error(`❌ useContentData error after ${duration}ms:`, {
        contentType,
        error: error.message,
        stack: error.stack,
        filters: { search, genre, status, type, year, season }
      });

      throw new Error(`Failed to load ${contentType}: ${error.message}`);
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