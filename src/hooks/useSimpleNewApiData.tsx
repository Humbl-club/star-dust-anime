import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UseSimpleNewApiDataParams {
  contentType: 'anime' | 'manga';
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  status?: string;
  type?: string;
  year?: string;
  season?: string;
  sort_by?: 'score' | 'popularity' | 'year' | 'title';
  order?: 'asc' | 'desc';
}

export interface AnimeTitle {
  id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis?: string;
  image_url?: string;
  score: number;
  year?: number;
  popularity?: number;
  genres: Array<{ id: number; name: string }>;
  anime_details?: {
    episodes?: number;
    season?: string;
    status?: string;
    type?: string;
    aired_from?: string;
    aired_to?: string;
  };
  manga_details?: {
    chapters?: number;
    volumes?: number;
    status?: string;
    type?: string;
    published_from?: string;
    published_to?: string;
  };
  studios?: Array<{ id: number; name: string }>;
  authors?: Array<{ id: number; name: string }>;
}

export interface UseSimpleNewApiDataResult {
  data: AnimeTitle[];
  loading: boolean;
  error: any;
  refetch: () => void;
}

export function useSimpleNewApiData(params: UseSimpleNewApiDataParams): UseSimpleNewApiDataResult {
  const {
    contentType,
    page = 0,
    limit = 50,
    search = '',
    genre = '',
    status = '',
    type = '',
    year = '',
    season = '',
    sort_by = 'score',
    order = 'desc'
  } = params;

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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      // Build the query
      let query = supabase
        .from('titles')
        .select(`
          *,
          ${contentType}_details!inner(*),
          ${genre ? 'title_genres!inner(genres!inner(*))' : 'title_genres(genres(*))'},
          ${contentType === 'anime' ? 'title_studios(studios(*))' : 'title_authors(authors(*))'}
        `);

      // Apply filters
      if (search) {
        query = query.textSearch('fts', search);
      }

      if (genre) {
        query = query.eq('title_genres.genres.name', genre);
      }

      if (status) {
        query = query.eq(`${contentType}_details.status`, status);
      }

      if (type) {
        query = query.eq(`${contentType}_details.type`, type);
      }

      if (year) {
        query = query.eq('year', parseInt(year));
      }

      if (season && contentType === 'anime') {
        query = query.eq('anime_details.season', season);
      }

      // Apply sorting
      query = query.order(sort_by, { ascending: order === 'asc' });

      // Apply pagination
      const from = page * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: results, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match expected format
      return (results || []).map((item: any) => ({
        id: item.id,
        title: item.title || '',
        title_english: item.title_english || '',
        title_japanese: item.title_japanese || '',
        synopsis: item.synopsis || '',
        image_url: item.image_url || '',
        score: item.score || 0,
        year: item.year || 0,
        popularity: item.popularity || 0,
        genres: item.title_genres?.map((tg: any) => tg.genres).filter(Boolean) || [],
        anime_details: contentType === 'anime' ? item.anime_details : undefined,
        manga_details: contentType === 'manga' ? item.manga_details : undefined,
        studios: contentType === 'anime' ? item.title_studios?.map((ts: any) => ts.studios).filter(Boolean) || [] : undefined,
        authors: contentType === 'manga' ? item.title_authors?.map((ta: any) => ta.authors).filter(Boolean) || [] : undefined,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  return {
    data: data || [],
    loading: isLoading,
    error,
    refetch,
  };
}