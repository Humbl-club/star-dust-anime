import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  synopsis: string; // Required field
  image_url: string; // Required field
  score?: number;
  anilist_score?: number;
  rank?: number;
  popularity?: number;
  favorites: number; // Add favorites field
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

// Optimized database query function with server-side filtering
const fetchTitlesData = async (options: UseSimpleNewApiDataOptions): Promise<{ data: any[], pagination: any }> => {
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

  console.log('Fetching data with optimized query:', options);

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
    console.error('Database error:', error);
    throw error;
  }

  console.log('Database response:', { count, dataLength: response?.length });

  // Transform data to match expected format
  const transformedData = response?.map((item: any) => {
    const baseData = {
      id: item.id,
      anilist_id: item.anilist_id,
      title: item.title || 'Unknown Title',
      title_english: item.title_english,
      title_japanese: item.title_japanese,
      synopsis: item.synopsis || '', // Ensure synopsis is always provided
      image_url: item.image_url || '', // Ensure image_url is always provided
      score: item.score,
      anilist_score: item.anilist_score,
      rank: item.rank,
      popularity: item.popularity,
      favorites: item.favorites || 0, // Add favorites field
      year: item.year,
      color_theme: item.color_theme,
      genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || [],
      members: item.popularity || 0
    };

    if (contentType === 'anime') {
      const details = item.anime_details;
      
      // Map database status to frontend expectations
      let mappedStatus = details?.status || 'Unknown';
      switch (mappedStatus) {
        case 'RELEASING':
          mappedStatus = 'Currently Airing';
          break;
        case 'FINISHED':
          mappedStatus = 'Finished Airing';
          break;
        case 'NOT_YET_RELEASED':
          mappedStatus = 'Not Yet Aired';
          break;
        case 'CANCELLED':
          mappedStatus = 'Cancelled';
          break;
      }
      
      return {
        ...baseData,
        episodes: details?.episodes || 0,
        aired_from: details?.aired_from,
        aired_to: details?.aired_to,
        season: details?.season,
        status: mappedStatus,
        type: details?.type || 'TV',
        trailer_url: details?.trailer_url,
        next_episode_date: details?.next_episode_date,
        studios: item.title_studios?.map((ts: any) => ts.studios?.name).filter(Boolean) || []
      };
    } else {
      const details = item.manga_details;
      
      // Map database status to frontend expectations
      let mappedStatus = details?.status || 'Unknown';
      switch (mappedStatus) {
        case 'RELEASING':
          mappedStatus = 'Currently Publishing';
          break;
        case 'FINISHED':
          mappedStatus = 'Finished';
          break;
        case 'NOT_YET_RELEASED':
          mappedStatus = 'Not Yet Published';
          break;
        case 'CANCELLED':
          mappedStatus = 'Cancelled';
          break;
      }
      
      return {
        ...baseData,
        chapters: details?.chapters || 0,
        volumes: details?.volumes || 0,
        published_from: details?.published_from,
        published_to: details?.published_to,
        status: mappedStatus,
        type: details?.type || 'Manga',
        next_chapter_date: details?.next_chapter_date,
        authors: item.title_authors?.map((ta: any) => ta.authors?.name).filter(Boolean) || []
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

  // Sync from external API function
  const syncFromExternal = async (pages = 1) => {
    try {
      console.log(`Starting ${contentType} sync using ultra-fast-sync...`);
      
      const { data: response, error } = await supabase.functions.invoke('ultra-fast-sync', {
        body: {
          contentType,
          maxPages: pages
        }
      });

      if (error) {
        console.error(`${contentType} sync error:`, error);
        throw error;
      }

      if (response?.success) {
        const processed = response.results?.processed || 0;
        toast.success(`Successfully synced ${processed} new ${contentType} items`);
        console.log(`${contentType} sync completed:`, response);
        
        // Invalidate all title queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['titles'] });
      } else {
        throw new Error(`Sync failed: ${response?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(`Error syncing ${contentType}:`, err);
      toast.error(`Failed to sync ${contentType} data`);
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
};