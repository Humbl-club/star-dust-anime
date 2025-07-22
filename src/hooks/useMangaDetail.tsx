import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Fetching manga detail for ID: ${mangaId}`);
      console.log(`🔍 ID type: ${typeof mangaId}, Is numeric: ${/^\d+$/.test(mangaId)}`);

      let query = supabase
        .from('titles')
        .select(`
          *,
          manga_details!inner(*),
          title_genres(genres(*)),
          title_authors(authors(*))
        `);

      // Try UUID first (most common case)
      if (mangaId.includes('-')) {
        console.log('🔍 Querying by UUID...');
        query = query.eq('id', mangaId);
      } else if (/^\d+$/.test(mangaId)) {
        console.log('🔍 Querying by AniList ID...');
        query = query.eq('anilist_id', parseInt(mangaId));
      } else {
        // Fallback: try as string ID
        console.log('🔍 Querying by string ID...');
        query = query.eq('id', mangaId);
      }

      const { data, error: queryError } = await query.maybeSingle();

      console.log('🔍 Query result:', { data, queryError });

      if (queryError) {
        console.error('❌ Database query error:', queryError);
        throw new Error(queryError.message || 'Failed to fetch manga details');
      }

      if (!data) {
        console.warn('⚠️ No manga found for ID:', mangaId);
        setManga(null);
        return;
      }

      // Transform the data to match the expected format
      const transformedManga: MangaDetail = {
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
        
        // Manga detail fields (from manga_details join)
        chapters: data.manga_details?.chapters,
        volumes: data.manga_details?.volumes,
        published_from: data.manga_details?.published_from,
        published_to: data.manga_details?.published_to,
        status: data.manga_details?.status || 'Unknown',
        type: data.manga_details?.type || 'Manga',
        next_chapter_date: data.manga_details?.next_chapter_date,
        next_chapter_number: data.manga_details?.next_chapter_number,
        last_sync_check: data.manga_details?.last_sync_check,
        
        // Related data arrays
        genres: data.title_genres?.map((tg: any) => tg.genres).filter(Boolean) || [],
        authors: data.title_authors?.map((ta: any) => ta.authors).filter(Boolean) || [],
      };

      console.log('✅ Successfully transformed manga:', transformedManga.title);
      setManga(transformedManga);

    } catch (err: any) {
      console.error('❌ Error fetching manga detail:', err);
      const errorMessage = `Failed to load manga details: ${err.message || 'Unknown error'}`;
      setError(errorMessage);
      toast.error(errorMessage);
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