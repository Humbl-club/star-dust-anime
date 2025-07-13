
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnimeDetail {
  // Title fields
  id: string;
  anilist_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis: string; // Made required to match Anime type
  image_url?: string;
  score?: number;
  anilist_score?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  year?: number;
  color_theme?: string;
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

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching anime detail for ID:', animeId);
      
      const { data: response, error: edgeError } = await supabase.functions.invoke('anime-detail-single', {
        body: { id: animeId }
      });

      console.log('Edge function response:', { response, edgeError });

      if (edgeError) {
        console.error('Edge function error:', edgeError);
        throw new Error(edgeError.message || 'Failed to fetch anime details');
      }

      if (!response?.success || !response?.data) {
        throw new Error('Invalid response format');
      }

      const animeData = response.data;
      
      // Transform the data to match the expected format
      const transformedAnime: AnimeDetail = {
        ...animeData,
        synopsis: animeData.synopsis || '', // Ensure synopsis is never undefined
        // Ensure genres and studios are arrays
        genres: Array.isArray(animeData.genres) ? animeData.genres : [],
        studios: Array.isArray(animeData.studios) ? animeData.studios : [],
      };

      console.log('Successfully fetched anime:', transformedAnime.title);
      setAnime(transformedAnime);

    } catch (err: any) {
      console.error('Error fetching anime detail:', err);
      const errorMessage = err.message || 'Failed to fetch anime details';
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
