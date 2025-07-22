
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

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching anime detail for ID: ${animeId} (attempt ${attempt + 1})`);

        const { data: response, error: edgeError } = await supabase.functions.invoke('anime-detail-single', {
          body: { id: animeId }
        });

        console.log('Edge function response:', { response, edgeError });

        if (edgeError) {
          console.error('Edge function error:', edgeError);
          throw new Error(edgeError.message || 'Failed to fetch anime details');
        }

        if (!response?.success || !response?.data) {
          throw new Error(response?.error || 'Invalid response format');
        }

        const animeData = response.data;
        
        // Transform the data to match the expected format
        const transformedAnime: AnimeDetail = {
          ...animeData,
          synopsis: animeData.synopsis || '', // Ensure synopsis is never undefined
          image_url: animeData.image_url || '', // Ensure image_url is never undefined
          num_users_voted: animeData.num_users_voted || 0, // Include the new field
          // Ensure genres and studios are arrays
          genres: Array.isArray(animeData.genres) ? animeData.genres : [],
          studios: Array.isArray(animeData.studios) ? animeData.studios : [],
        };

        console.log('Successfully fetched anime:', transformedAnime.title);
        setAnime(transformedAnime);
        return;

      } catch (err: any) {
        attempt++;
        const isLastAttempt = attempt >= maxRetries;
        
        console.error(`Error fetching anime detail (attempt ${attempt}):`, err);
        
        if (isLastAttempt) {
          const errorMessage = `Failed to load anime details: ${err.message || 'Unknown error'}`;
          setError(errorMessage);
          toast.error(errorMessage);
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } finally {
        if (attempt >= maxRetries) {
          setLoading(false);
        }
      }
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
