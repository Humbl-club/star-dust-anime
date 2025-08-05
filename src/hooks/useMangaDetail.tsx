import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

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
  
  // Consolidated data from edge function
  recommendations?: any[];
  streaming_availability?: any;
  user_list_status?: any;
  related_titles?: any[];
}

interface UseMangaDetailResult {
  manga: MangaDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMangaDetail = (mangaId: string): UseMangaDetailResult => {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['manga-detail-consolidated', mangaId, user?.id],
    queryFn: async () => {
      if (!mangaId) {
        throw new Error('Manga ID is required');
      }

      logger.debug(`🚀 Fetching consolidated manga details for: ${mangaId}`);
      
      const { data, error } = await supabase.functions.invoke('get-content-details', {
        body: {
          content_id: mangaId,
          type: 'manga',
          user_id: user?.id
        }
      });

      if (error) {
        logger.debug('❌ Consolidated manga detail error:', error);
        throw new Error(error.message || 'Failed to fetch manga details');
      }

      if (!data?.content) {
        logger.debug('⚠️ No manga found for ID:', mangaId);
        throw new Error('Manga not found');
      }

      // Transform the data to match the expected interface
      const transformedData: MangaDetail = {
        // Title fields
        id: data.content.id,
        anilist_id: data.content.anilist_id,
        title: data.content.title,
        title_english: data.content.title_english,
        title_japanese: data.content.title_japanese,
        synopsis: data.content.synopsis || '',
        image_url: data.content.image_url || '',
        score: data.content.score,
        anilist_score: data.content.anilist_score,
        rank: data.content.rank,
        popularity: data.content.popularity,
        year: data.content.year,
        color_theme: data.content.color_theme,
        num_users_voted: 0,
        created_at: data.content.created_at,
        updated_at: data.content.updated_at,
        
        // Manga detail fields (from manga_details join)
        chapters: data.content.manga_details?.[0]?.chapters,
        volumes: data.content.manga_details?.[0]?.volumes,
        published_from: data.content.manga_details?.[0]?.published_from,
        published_to: data.content.manga_details?.[0]?.published_to,
        status: data.content.manga_details?.[0]?.status || 'Unknown',
        type: data.content.manga_details?.[0]?.type || 'Manga',
        next_chapter_date: data.content.manga_details?.[0]?.next_chapter_date,
        next_chapter_number: data.content.manga_details?.[0]?.next_chapter_number,
        last_sync_check: data.content.manga_details?.[0]?.last_sync_check,
        
        // Extract genres and authors
        genres: data.content.title_genres?.map((tg: any) => tg.genres).filter(Boolean) || [],
        authors: data.content.title_authors?.map((ta: any) => ta.authors).filter(Boolean) || [],
        
        // Add consolidated data from edge function
        recommendations: data.recommendations || [],
        streaming_availability: data.streaming_availability,
        user_list_status: data.user_list_status,
        related_titles: data.related_titles || []
      };

      logger.debug('✅ Successfully transformed consolidated manga:', transformedData.title);
      return transformedData;
    },
    enabled: !!mangaId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });

  return {
    manga: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch
  };
};