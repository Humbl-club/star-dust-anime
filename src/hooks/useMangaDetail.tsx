
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  generateCorrelationId, 
  classifyError, 
  logError, 
  formatErrorForUser 
} from '@/utils/errorUtils';

interface MangaDetail {
  // Title fields
  id: string;
  anilist_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis: string; // Required to match Manga type
  image_url: string; // Required to match Manga type
  score?: number;
  anilist_score?: number;
  rank?: number;
  popularity?: number;
  year?: number;
  num_users_voted?: number;
  color_theme?: string;
  created_at: string;
  updated_at: string;
  // Manga detail fields
  chapters?: number;
  volumes?: number;
  published_from?: string;
  published_to?: string;
  status: string;
  type: string;
  next_chapter_date?: string;
  next_chapter_number?: number;
  last_sync_check: string;
  // Related data arrays
  genres?: Array<{ id: string; name: string; type?: string; created_at?: string }>;
  authors?: Array<{ id: string; name: string; created_at?: string }>;
}

interface UseMangaDetailResult {
  manga: MangaDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useMangaDetail = (mangaId: string): UseMangaDetailResult => {
  const [manga, setManga] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMangaDetail = async () => {
    if (!mangaId) {
      setError('Manga ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    const correlationId = generateCorrelationId();
    
    try {
      console.log(`[${correlationId.slice(-8)}] Fetching manga detail for ID:`, mangaId);
      
      const { data: response, error: edgeError } = await supabase.functions.invoke('manga-detail-single', {
        body: { id: mangaId, correlationId }
      });

      console.log(`[${correlationId.slice(-8)}] Edge function response:`, { response, edgeError });

      if (edgeError) {
        throw new Error(edgeError.message || 'Failed to fetch manga details');
      }

      if (!response?.success || !response?.data) {
        throw new Error(response?.error || 'Invalid response format');
      }

      const mangaData = response.data;
      
      // Transform the data to match the expected format
      const transformedManga: MangaDetail = {
        ...mangaData,
        synopsis: mangaData.synopsis || '', // Ensure synopsis is never undefined
        image_url: mangaData.image_url || '', // Ensure image_url is never undefined
        num_users_voted: mangaData.num_users_voted || 0, // Include the new field
        // Ensure genres and authors are arrays
        genres: Array.isArray(mangaData.genres) ? mangaData.genres : [],
        authors: Array.isArray(mangaData.authors) ? mangaData.authors : [],
      };

      console.log(`[${correlationId.slice(-8)}] Successfully fetched manga:`, transformedManga.title);
      setManga(transformedManga);

    } catch (err: any) {
      // Enhanced error handling with classification
      const classifiedError = classifyError(err, correlationId, 'fetch_manga_detail');
      
      // Log error with context
      await logError(classifiedError, err);
      
      // Set error state with user-friendly message
      setError(classifiedError.userMessage);
      
      // Show toast with formatted error
      toast.error(formatErrorForUser(classifiedError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mangaId) {
      fetchMangaDetail();
    }
  }, [mangaId]);

  return {
    manga,
    loading,
    error,
    refetch: fetchMangaDetail
  };
};
