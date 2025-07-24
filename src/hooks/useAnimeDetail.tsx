
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface AnimeDetail {
  // Title fields
  id: string;
  anilist_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis: string; // Required to match Anime type
  image_url: string; // Required to match Anime type
  score?: number;
  anilist_score?: number;
  rank?: number;
  popularity?: number;
  year?: number;
  color_theme?: string;
  num_users_voted?: number;
  created_at: string;
  updated_at: string;
  // Anime detail fields
  episodes?: number;
  aired_from?: string;
  aired_to?: string;
  season?: string;
  status: string;
  type: string;
  trailer_url?: string;
  trailer_site?: string;
  trailer_id?: string;
  next_episode_date?: string;
  next_episode_number?: number;
  last_sync_check: string;
  // Related data arrays
  genres?: Array<{ id: string; name: string; type?: string; created_at?: string }>;
  studios?: Array<{ id: string; name: string; created_at?: string }>;
}

interface UseAnimeDetailResult {
  anime: AnimeDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAnimeDetail = (animeId: string): UseAnimeDetailResult => {
  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnimeDetail = async () => {
    if (!animeId) {
      setError('Anime ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      logger.debug(`🔍 Fetching anime detail for ID: ${animeId}`);
      logger.debug(`🔍 ID type: ${typeof animeId}, Is numeric: ${/^\d+$/.test(animeId)}`);

      let query = supabase
        .from('titles')
        .select(`
          *,
          anime_details!inner(*),
          title_genres(genres(*)),
          title_studios(studios(*))
        `);

      // Try UUID first (most common case)
      if (animeId.includes('-')) {
        logger.debug('🔍 Querying by UUID...');
        query = query.eq('id', animeId);
      } else if (/^\d+$/.test(animeId)) {
        logger.debug('🔍 Querying by AniList ID...');
        query = query.eq('anilist_id', parseInt(animeId));
      } else {
        // Fallback: try as string ID
        logger.debug('🔍 Querying by string ID...');
        query = query.eq('id', animeId);
      }

      const { data, error: queryError } = await query.maybeSingle();

      logger.debug('🔍 Query result:', { data, queryError });

      if (queryError) {
        console.error('❌ Database query error:', queryError);
        throw new Error(queryError.message || 'Failed to fetch anime details');
      }

      if (!data) {
        logger.debug('⚠️ No anime found for ID:', animeId);
        setAnime(null);
        return;
      }

      // Transform the data to match the expected format
      const transformedAnime: AnimeDetail = {
        // Title fields
        id: data.id,
        anilist_id: data.anilist_id,
        title: data.title,
        title_english: data.title_english,
        title_japanese: data.title_japanese,
        synopsis: data.synopsis || '',
        image_url: data.image_url || '',
        score: data.score,
        anilist_score: data.anilist_score,
        rank: data.rank,
        popularity: data.popularity,
        year: data.year,
        color_theme: data.color_theme,
        num_users_voted: 0, // Will be calculated separately if needed
        created_at: data.created_at,
        updated_at: data.updated_at,
        
        // Anime detail fields (from anime_details join)
        episodes: data.anime_details?.episodes,
        aired_from: data.anime_details?.aired_from,
        aired_to: data.anime_details?.aired_to,
        season: data.anime_details?.season,
        status: data.anime_details?.status || 'Unknown',
        type: data.anime_details?.type || 'TV',
        trailer_url: data.anime_details?.trailer_url,
        trailer_site: data.anime_details?.trailer_site,
        trailer_id: data.anime_details?.trailer_id,
        next_episode_date: data.anime_details?.next_episode_date,
        next_episode_number: data.anime_details?.next_episode_number,
        last_sync_check: data.anime_details?.last_sync_check,
        
        // Related data arrays
        genres: data.title_genres?.map((tg: any) => tg.genres).filter(Boolean) || [],
        studios: data.title_studios?.map((ts: any) => ts.studios).filter(Boolean) || [],
      };

      logger.debug('✅ Successfully transformed anime:', transformedAnime.title);
      setAnime(transformedAnime);

    } catch (err: any) {
      console.error('❌ Error fetching anime detail:', err);
      const errorMessage = `Failed to load anime details: ${err.message || 'Unknown error'}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (animeId) {
      fetchAnimeDetail();
    }
  }, [animeId]);

  return {
    anime,
    loading,
    error,
    refetch: fetchAnimeDetail
  };
};
