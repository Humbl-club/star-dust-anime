import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  generateCorrelationId, 
  classifyError, 
  logError, 
  formatErrorForUser 
} from '@/utils/errorUtils';

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

// Common interface for all content types
interface BaseContent {
  id: string;
  anilist_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis: string;
  image_url: string;
  score?: number;
  anilist_score?: number;
  rank?: number;
  popularity?: number;
  year?: number;
  color_theme?: string;
  genres: string[];
  members: number;
  status: string;
  type: string;
}

// Anime-specific interface
interface AnimeContent extends BaseContent {
  episodes: number;
  aired_from?: string;
  aired_to?: string;
  season?: string;
  trailer_url?: string;
  next_episode_date?: string;
  studios: string[];
}

// Manga-specific interface
interface MangaContent extends BaseContent {
  chapters: number;
  volumes: number;
  published_from?: string;
  published_to?: string;
  next_chapter_date?: string;
  authors: string[];
}

// Enhanced pagination interface
interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

// Improved database query function that starts from detail tables
const fetchTitlesData = async (options: UseSimpleNewApiDataOptions): Promise<{ data: (AnimeContent | MangaContent)[], pagination: PaginationInfo }> => {
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
    order = 'desc'
  } = options;

  const correlationId = generateCorrelationId();
  console.log(`[${correlationId.slice(-8)}] Starting improved ${contentType} query:`, options);

  try {
    let query;
    let countQuery;

    if (contentType === 'anime') {
      // Query from titles and join with anime_details
      query = supabase
        .from('titles')
        .select(`
          id,
          anilist_id,
          title,
          title_english,
          title_japanese,
          synopsis,
          image_url,
          score,
          anilist_score,
          rank,
          popularity,
          year,
          color_theme,
          anime_details!inner(
            episodes,
            aired_from,
            aired_to,
            season,
            status,
            type,
            trailer_url,
            next_episode_date
          )
        `);

      countQuery = supabase
        .from('titles')
        .select('*, anime_details!inner(title_id)', { count: 'exact', head: true });
    } else {
      // Query from titles and join with manga_details
      query = supabase
        .from('titles')
        .select(`
          id,
          anilist_id,
          title,
          title_english,
          title_japanese,
          synopsis,
          image_url,
          score,
          anilist_score,
          rank,
          popularity,
          year,
          color_theme,
          manga_details!inner(
            chapters,
            volumes,
            published_from,
            published_to,
            status,
            type,
            next_chapter_date
          )
        `);

      countQuery = supabase
        .from('titles')
        .select('*, manga_details!inner(title_id)', { count: 'exact', head: true });
    }

    // Apply filters to both query and count query
    const applyFilters = (q: any) => {
      if (search) {
        const searchTerm = search.trim();
        if (searchTerm) {
          q = q.or(`title.ilike.%${searchTerm}%,title_english.ilike.%${searchTerm}%,title_japanese.ilike.%${searchTerm}%`);
        }
      }

      if (year) {
        q = q.eq('year', parseInt(year));
      }

      if (status && contentType === 'anime') {
        q = q.eq('anime_details.status', status);
      } else if (status && contentType === 'manga') {
        q = q.eq('manga_details.status', status);
      }

      if (type && contentType === 'anime') {
        q = q.eq('anime_details.type', type);
      } else if (type && contentType === 'manga') {
        q = q.eq('manga_details.type', type);
      }

      if (season && contentType === 'anime') {
        q = q.eq('anime_details.season', season);
      }

      return q;
    };

    // Apply filters
    query = applyFilters(query);
    countQuery = applyFilters(countQuery);

    // Get total count first
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error(`[${correlationId.slice(-8)}] Count query error:`, countError);
      throw countError;
    }

    console.log(`[${correlationId.slice(-8)}] Total ${contentType} count:`, count || 0);

    // Apply sorting and pagination to main query  
    const sortField = sort_by === 'score' ? 'score' : sort_by;
    query = query.order(sortField, { ascending: order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    console.log('Query executed:', { 
      data: data?.length, 
      error, 
      firstItem: data?.[0] 
    });

    if (error) {
      console.error(`[${correlationId.slice(-8)}] Main query error:`, error);
      throw error;
    }

    console.log(`[${correlationId.slice(-8)}] Raw query result:`, data?.length || 0, 'items');

    if (!data || data.length === 0) {
      console.log(`[${correlationId.slice(-8)}] No ${contentType} found`);
      return {
        data: [],
        pagination: {
          current_page: page,
          per_page: limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
          has_next_page: false,
          has_prev_page: false
        }
      };
    }

    // Transform the data
    const transformedData = data
      .filter(item => item && (item.anime_details || item.manga_details)) // Ensure we have detail data
      .map((item: any): AnimeContent | MangaContent => {
        const baseData = {
          id: item.id,
          anilist_id: item.anilist_id,
          title: item.title || 'Unknown Title',
          title_english: item.title_english,
          title_japanese: item.title_japanese,
          synopsis: item.synopsis || '',
          image_url: item.image_url || '',
          score: item.score,
          anilist_score: item.anilist_score,
          rank: item.rank,
          popularity: item.popularity,
          year: item.year,
          color_theme: item.color_theme,
          genres: [],
          members: item.popularity || 0
        };

        if (contentType === 'anime' && item.anime_details) {
          const details = item.anime_details;
          return {
            ...baseData,
            status: details.status || 'Unknown',
            type: details.type || 'TV',
            episodes: details.episodes || 0,
            aired_from: details.aired_from,
            aired_to: details.aired_to,
            season: details.season,
            trailer_url: details.trailer_url,
            next_episode_date: details.next_episode_date,
            studios: []
          } as AnimeContent;
        } else if (contentType === 'manga' && item.manga_details) {
          const details = item.manga_details;
          return {
            ...baseData,
            status: details.status || 'Unknown',
            type: details.type || 'Manga',
            chapters: details.chapters || 0,
            volumes: details.volumes || 0,
            published_from: details.published_from,
            published_to: details.published_to,
            next_chapter_date: details.next_chapter_date,
            authors: []
          } as MangaContent;
        }

        // Fallback
        return {
          ...baseData,
          status: 'Unknown',
          type: contentType === 'anime' ? 'TV' : 'Manga',
          episodes: 0,
          studios: []
        } as AnimeContent;
      });

    // Build pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const pagination = {
      current_page: page,
      per_page: limit,
      total: count || 0,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1
    };

    console.log('Transformed data:', {
      length: transformedData.length,
      sample: transformedData[0]
    });

    console.log(`[${correlationId.slice(-8)}] Successfully transformed ${transformedData.length} ${contentType} items`);
    console.log(`[${correlationId.slice(-8)}] Sample item:`, transformedData[0]);

    return { data: transformedData, pagination };

  } catch (error) {
    console.error(`[${correlationId.slice(-8)}] Fetch error:`, error);
    // Don't throw here, return empty data to prevent crashes
    return {
      data: [],
      pagination: {
        current_page: page,
        per_page: limit,
        total: 0,
        total_pages: 0,
        has_next_page: false,
        has_prev_page: false
      }
    };
  }
};

// Hook return type interface
interface UseSimpleApiDataReturn<T> {
  data: T[];
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  syncFromExternal: (pages?: number) => Promise<void>;
  refetch: () => Promise<unknown>;
}

// Implementation function
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
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Sync from external API function
  const syncFromExternal = async (pages = 1) => {
    const correlationId = generateCorrelationId();
    
    try {
      console.log(`[${correlationId.slice(-8)}] Starting ${contentType} sync using ultra-fast-sync...`);
      
      const { data: response, error } = await supabase.functions.invoke('ultra-fast-sync', {
        body: {
          contentType,
          maxPages: pages,
          correlationId
        }
      });

      if (error) {
        throw error;
      }

      if (response?.success) {
        const processed = response.results?.processed || 0;
        toast.success(`Successfully synced ${processed} new ${contentType} items`);
        console.log(`[${correlationId.slice(-8)}] ${contentType} sync completed:`, response);
        
        // Invalidate all title queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['titles'] });
      } else {
        throw new Error(`Sync failed: ${response?.message || 'Unknown error'}`);
      }
    } catch (err: unknown) {
      // Enhanced error handling with classification
      const classifiedError = classifyError(err, correlationId, `sync_${contentType}`);
      await logError(classifiedError, err);
      
      // Show user-friendly error message
      toast.error(formatErrorForUser(classifiedError));
      throw classifiedError;
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
};
