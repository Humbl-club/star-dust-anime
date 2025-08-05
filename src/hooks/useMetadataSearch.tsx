import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MetadataSearchParams {
  genres?: string[];
  tags?: string[];
  studios?: string[];
  creators?: string[];
  contentType?: 'anime' | 'manga';
}

export const useMetadataSearch = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const search = useCallback(async (params: MetadataSearchParams) => {
    setLoading(true);
    try {
      let query = supabase
        .from('titles')
        .select(`
          *,
          anime_details(*),
          manga_details(*),
          title_genres(genres(*)),
          title_studios(studios(*)),
          title_authors(authors(*))
        `);

      // Filter by content type
      if (params.contentType === 'anime') {
        query = query.not('anime_details', 'is', null);
      } else if (params.contentType === 'manga') {
        query = query.not('manga_details', 'is', null);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      
      // Client-side filtering for metadata (could be optimized with better DB queries)
      let filteredData = data || [];
      
      if (params.genres && params.genres.length > 0) {
        filteredData = filteredData.filter(title => 
          title.title_genres?.some((tg: any) => 
            params.genres!.includes(tg.genres?.slug)
          )
        );
      }

      if (params.studios && params.studios.length > 0) {
        filteredData = filteredData.filter(title => 
          title.title_studios?.some((ts: any) => 
            params.studios!.includes(ts.studios?.slug)
          )
        );
      }

      if (params.creators && params.creators.length > 0) {
        filteredData = filteredData.filter(title => 
          title.title_authors?.some((ta: any) => 
            params.creators!.includes(ta.authors?.slug)
          )
        );
      }

      setResults(filteredData);
    } catch (error) {
      console.error('Metadata search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, results, loading };
};