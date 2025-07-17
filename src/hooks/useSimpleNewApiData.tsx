import { useState, useEffect } from 'react';
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

export const useSimpleNewApiData = (options: UseSimpleNewApiDataOptions) => {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching data with direct query:', {
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
      });

      // Build base query
      let query = supabase
        .from('titles')
        .select(`
          *,
          ${contentType === 'anime' ? 'anime_details(*), title_studios(studios(*))' : 'manga_details(*), title_authors(authors(*))'},
          title_genres(genres(*))
        `, { count: 'exact' });

      // Apply text search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%,title_english.ilike.%${search}%,title_japanese.ilike.%${search}%`);
      }

      // Apply year filter
      if (year) {
        query = query.eq('year', parseInt(year));
      }

      // Apply sorting
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

      // Filter data based on additional criteria (client-side filtering for complex conditions)
      let filteredData = response || [];

      // Apply genre filter
      if (genre) {
        filteredData = filteredData.filter(item => 
          item.title_genres?.some((tg: any) => tg.genres?.name === genre)
        );
      }

      // Apply content-specific filters
      if (contentType === 'anime') {
        if (status) {
          filteredData = filteredData.filter(item => 
            (item as any).anime_details?.status === status
          );
        }
        if (type) {
          filteredData = filteredData.filter(item => 
            (item as any).anime_details?.type === type
          );
        }
        if (season) {
          filteredData = filteredData.filter(item => 
            (item as any).anime_details?.season === season
          );
        }
      } else {
        if (status) {
          filteredData = filteredData.filter(item => 
            (item as any).manga_details?.status === status
          );
        }
        if (type) {
          filteredData = filteredData.filter(item => 
            (item as any).manga_details?.type === type
          );
        }
      }

      // Transform data to match expected format
      const transformedData = filteredData.map((item: any) => ({
        id: item.id,
        anilist_id: item.anilist_id,
        title: item.title,
        title_english: item.title_english,
        title_japanese: item.title_japanese,
        synopsis: item.synopsis,
        image_url: item.image_url,
        score: item.score,
        anilist_score: item.anilist_score,
        rank: item.rank,
        popularity: item.popularity,
        year: item.year,
        color_theme: item.color_theme,
        
        // Content-specific fields
        ...(contentType === 'anime' && item.anime_details ? {
          episodes: item.anime_details.episodes,
          aired_from: item.anime_details.aired_from,
          aired_to: item.anime_details.aired_to,
          season: item.anime_details.season,
          status: item.anime_details.status,
          type: item.anime_details.type,
          trailer_url: item.anime_details.trailer_url,
          next_episode_date: item.anime_details.next_episode_date,
          studios: item.title_studios?.map((ts: any) => ts.studios?.name).filter(Boolean) || []
        } : {}),
        
        ...(contentType === 'manga' && item.manga_details ? {
          chapters: item.manga_details.chapters,
          volumes: item.manga_details.volumes,
          published_from: item.manga_details.published_from,
          published_to: item.manga_details.published_to,
          status: item.manga_details.status,
          type: item.manga_details.type,
          next_chapter_date: item.manga_details.next_chapter_date,
          authors: item.title_authors?.map((ta: any) => ta.authors?.name).filter(Boolean) || []
        } : {}),
        
        // Common fields
        genres: item.title_genres?.map((tg: any) => tg.genres?.name).filter(Boolean) || []
      }));

      setData(transformedData);
      
      // Set pagination
      const totalPages = count ? Math.ceil(count / limit) : 1;
      setPagination({
        current_page: page,
        per_page: limit,
        total: count || 0,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      });

      console.log('Transformed data:', transformedData.length, 'items');
      
    } catch (err: any) {
      console.error(`Error fetching ${contentType}:`, err);
      setError(err.message || 'Failed to fetch data');
      toast.error(`Failed to load ${contentType}`);
    } finally {
      setLoading(false);
    }
  };

  const syncFromExternal = async (pages = 1) => {
    setLoading(true);
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
      } else {
        throw new Error(`Sync failed: ${response?.message || 'Unknown error'}`);
      }

      // Refresh local data after sync
      await fetchData();
    } catch (err: any) {
      console.error(`Error syncing ${contentType}:`, err);
      toast.error(`Failed to sync ${contentType} data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [
    contentType, page, limit, search, genre, status, type, year, season, sort_by, order, autoFetch
  ]);

  return {
    data,
    pagination,
    loading,
    error,
    fetchData,
    syncFromExternal,
    refetch: fetchData
  };
};