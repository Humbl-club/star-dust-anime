
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

// Direct database query function
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
  console.log(`[${correlationId.slice(-8)}] Fetching ${contentType} data directly from database:`, options);

  try {
    // Step 1: Get titles with basic info
    let titlesQuery = supabase
      .from('titles')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      const searchTerm = search.trim();
      if (searchTerm) {
        titlesQuery = titlesQuery.or(`title.ilike.%${searchTerm}%,title_english.ilike.%${searchTerm}%,title_japanese.ilike.%${searchTerm}%`);
      }
    }

    if (year) {
      titlesQuery = titlesQuery.eq('year', parseInt(year));
    }

    // Apply sorting
    const sortField = sort_by === 'score' ? 'score' : sort_by;
    titlesQuery = titlesQuery.order(sortField, { ascending: order === 'asc', nullsFirst: false });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    titlesQuery = titlesQuery.range(from, to);

    const { data: titlesData, error: titlesError, count } = await titlesQuery;

    if (titlesError) {
      console.error(`[${correlationId.slice(-8)}] Titles query error:`, titlesError);
      throw titlesError;
    }

    if (!titlesData || titlesData.length === 0) {
      console.log(`[${correlationId.slice(-8)}] No titles found`);
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

    console.log(`[${correlationId.slice(-8)}] Found ${titlesData.length} titles`);

    // Step 2: Get content-specific details
    const titleIds = titlesData.map(title => title.id);
    let contentDetails: any[] = [];

    if (contentType === 'anime') {
      const { data: animeData, error: animeError } = await supabase
        .from('anime_details')
        .select('*')
        .in('title_id', titleIds);

      if (animeError) {
        console.error(`[${correlationId.slice(-8)}] Anime details error:`, animeError);
        throw animeError;
      }

      contentDetails = animeData || [];
    } else {
      const { data: mangaData, error: mangaError } = await supabase
        .from('manga_details')
        .select('*')
        .in('title_id', titleIds);

      if (mangaError) {
        console.error(`[${correlationId.slice(-8)}] Manga details error:`, mangaError);
        throw mangaError;
      }

      contentDetails = mangaData || [];
    }

    console.log(`[${correlationId.slice(-8)}] Found ${contentDetails.length} content details`);

    // Step 3: Combine and transform data
    const transformedData = titlesData
      .map((title: any): AnimeContent | MangaContent | null => {
        const details = contentDetails.find(detail => detail.title_id === title.id);
        
        // Skip titles without matching details
        if (!details) {
          return null;
        }

        const baseData = {
          id: title.id,
          anilist_id: title.anilist_id,
          title: title.title,
          title_english: title.title_english,
          title_japanese: title.title_japanese,
          synopsis: title.synopsis || '',
          image_url: title.image_url || '',
          score: title.score,
          anilist_score: title.anilist_score,
          rank: title.rank,
          popularity: title.popularity,
          year: title.year,
          color_theme: title.color_theme,
          genres: [],
          members: title.popularity || 0
        };

        if (contentType === 'anime') {
          return {
            ...baseData,
            episodes: details.episodes || 0,
            aired_from: details.aired_from,
            aired_to: details.aired_to,
            season: details.season,
            status: details.status || 'Unknown',
            type: details.type || 'TV',
            trailer_url: details.trailer_url,
            next_episode_date: details.next_episode_date,
            studios: []
          };
        } else {
          return {
            ...baseData,
            chapters: details.chapters || 0,
            volumes: details.volumes || 0,
            published_from: details.published_from,
            published_to: details.published_to,
            status: details.status || 'Unknown',
            type: details.type || 'Manga',
            next_chapter_date: details.next_chapter_date,
            authors: []
          };
        }
      })
      .filter(Boolean) as (AnimeContent | MangaContent)[];

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

    console.log(`[${correlationId.slice(-8)}] Returning ${transformedData.length} items`);
    return { data: transformedData, pagination };

  } catch (error) {
    console.error(`[${correlationId.slice(-8)}] Fetch error:`, error);
    throw error;
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
