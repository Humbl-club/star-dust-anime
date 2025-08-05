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
      const { data, error } = await supabase.rpc('search_titles_by_metadata', {
        genre_slugs: params.genres || null,
        tag_slugs: params.tags || null,
        studio_slugs: params.studios || null,
        creator_slugs: params.creators || null,
        content_type_filter: params.contentType || null
      });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Metadata search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, results, loading };
};