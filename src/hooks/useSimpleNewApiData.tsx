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

// Database response interfaces
interface DatabaseAnimeDetails {
  episodes?: number;
  aired_from?: string;
  aired_to?: string;
  season?: string;
  status?: string;
  type?: string;
  trailer_url?: string;
  next_episode_date?: string;
}

interface DatabaseMangaDetails {
  chapters?: number;
  volumes?: number;
  published_from?: string;
  published_to?: string;
  status?: string;
  type?: string;
  next_chapter_date?: string;
}

interface DatabaseTitleGenre {
  genres?: { name: string };
}

interface DatabaseTitleStudio {
  studios?: { name: string };
}

interface DatabaseTitleAuthor {
  authors?: { name: string };
}

interface DatabaseResponse {
  id: string;
  anilist_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis?: string;
  image_url?: string;
  score?: number;
  anilist_score?: number;
  rank?: number;
  popularity?: number;
  year?: number;
  color_theme?: string;
  anime_details?: DatabaseAnimeDetails;
  manga_details?: DatabaseMangaDetails;
  title_genres?: DatabaseTitleGenre[];
  title_studios?: DatabaseTitleStudio[];
  title_authors?: DatabaseTitleAuthor[];
}

// Common interface for all content types
interface BaseContent {
  id: string;
  anilist_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis: string; // Required field
  image_url: string; // Required field
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

// Optimized database query function with server-side filtering
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
  console.log(`[${correlationId.slice(-8)}] Fetching data with optimized query:`, options);

  // Build optimized query with server-side filtering
  let query = supabase
    .from('titles')
    .select(`
      *,
      ${contentType === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
      ${genre ? 'title_genres!inner(genres!inner(*))' : 'title_genres(genres(*))'},
      ${contentType === 'anime' ? 'title_studios(studios(*))' : 'title_authors(authors(*))'}
    `, { count: 'exact' });

  // Apply content-specific filters at database level
  if (contentType === 'anime') {
    if (status) {
      query = query.eq('anime_details.status', status);
    }
    if (type) {
      query = query.eq('anime_details.type', type);
    }
    if (season) {
      query = query.eq('anime_details.season', season);
    }
  } else {
    if (status) {
      query = query.eq('manga_details.status', status);
    }
    if (type) {
      query = query.eq('manga_details.type', type);
    }
  }

  // Apply genre filter at database level
  if (genre) {
    query = query.eq('title_genres.genres.name', genre);
  }

  // Apply year filter
  if (year) {
    query = query.eq('year', parseInt(year));
  }

  // Apply text search with better performance
  if (search) {
    const searchTerm = search.trim();
    if (searchTerm) {
      // Use full-text search for better performance with the new index
      query = query.or(`title.ilike.%${searchTerm}%,title_english.ilike.%${searchTerm}%,title_japanese.ilike.%${searchTerm}%`);
    }
  }

  // Apply optimized sorting using indexes
  const sortField = sort_by === 'score' ? 'score' : sort_by;
  query = query.order(sortField, { ascending: order === 'asc', nullsFirst: false });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: response, error, count } = await query;

  if (error) {
    console.error(`[${correlationId.slice(-8)}] Database error:`, error);
    const classifiedError = classifyError(error, correlationId, 'fetch_titles_data');
    await logError(classifiedError, error);
    throw classifiedError;
  }

  console.log(`[${correlationId.slice(-8)}] Database response:`, { count, dataLength: response?.length });

  // Transform data to match expected format
  const transformedData = response?.map((item: DatabaseResponse): AnimeContent | MangaContent => {
    const baseData = {
      id: item.id,
      anilist_id: item.anilist_id,
      title: item.title,
      title_english: item.title_english,
      title_japanese: item.title_japanese,
      synopsis: item.synopsis || '', // Ensure synopsis is always provided
      image_url: item.image_url || '', // Ensure image_url is always provided
      score: item.score,
      anilist_score: item.anilist_score,
      rank: item.rank,
      popularity: item.popularity,
      year: item.year,
      color_theme: item.color_theme,
      genres: item.title_genres?.map((tg) => tg.genres?.name).filter(Boolean) || [],
      members: item.popularity || 0
    };

    if (contentType === 'anime') {
      return {
        ...baseData,
        episodes: item.anime_details?.episodes || 0,
        aired_from: item.anime_details?.aired_from,
        aired_to: item.anime_details?.aired_to,
        season: item.anime_details?.season,
        status: item.anime_details?.status || 'Unknown',
        type: item.anime_details?.type || 'TV',
        trailer_url: item.anime_details?.trailer_url,
        next_episode_date: item.anime_details?.next_episode_date,
        studios: item.title_studios?.map((ts) => ts.studios?.name).filter(Boolean) || []
      };
    } else {
      return {
        ...baseData,
        chapters: item.manga_details?.chapters || 0,
        volumes: item.manga_details?.volumes || 0,
        published_from: item.manga_details?.published_from,
        published_to: item.manga_details?.published_to,
        status: item.manga_details?.status || 'Unknown',
        type: item.manga_details?.type || 'Manga',
        next_chapter_date: item.manga_details?.next_chapter_date,
        authors: item.title_authors?.map((ta) => ta.authors?.name).filter(Boolean) || []
      };
    }
  }) || [];

  // Build pagination info
  const totalPages = count ? Math.ceil(count / limit) : 1;
  const pagination = {
    current_page: page,
    per_page: limit,
    total: count || 0,
    total_pages: totalPages,
    has_next_page: page < totalPages,
    has_prev_page: page > 1
  };

  return { data: transformedData, pagination };
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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