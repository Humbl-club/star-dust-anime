import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SearchOptions {
  query: string;
  contentType?: 'anime' | 'manga' | 'all';
  filters?: {
    genre?: string;
    year?: number;
    status?: string;
    minScore?: number;
  };
  limit?: number;
}

export function useOptimizedSearch(options: SearchOptions) {
  const { query, contentType = 'all', filters, limit = 24 } = options;

  return useQuery({
    queryKey: ['optimized-search', query, contentType, filters],
    queryFn: async () => {
      if (!query || query.length < 2) return { results: [], total: 0 };

      // Build optimized query
      let searchQuery = supabase
        .from('titles')
        .select(`
          id,
          title,
          title_english,
          title_japanese,
          image_url,
          score,
          year,
          popularity,
          ${contentType === 'anime' ? 'anime_details!inner(type,status,episodes)' : ''}
          ${contentType === 'manga' ? 'manga_details!inner(type,status,chapters)' : ''}
          ${contentType === 'all' ? 'anime_details(type,status,episodes),manga_details(type,status,chapters)' : ''}
        `, { count: 'exact' });

      // Add search condition with fuzzy matching
      const noSpaces = query.replace(/\s/g, '');
      searchQuery = searchQuery.or(
        `title.ilike.%${query}%,title_english.ilike.%${query}%,title_japanese.ilike.%${query}%,title.ilike.%${noSpaces}%`
      );

      // Apply filters
      if (filters?.year) {
        searchQuery = searchQuery.eq('year', filters.year);
      }
      if (filters?.minScore) {
        searchQuery = searchQuery.gte('score', filters.minScore);
      }

      // Order by relevance (popularity for now)
      searchQuery = searchQuery
        .order('popularity', { ascending: false })
        .limit(limit);

      const { data, error, count } = await searchQuery;

      if (error) throw error;

      return {
        results: data || [],
        total: count || 0
      };
    },
    enabled: query.length >= 2,
    staleTime: 60 * 1000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

// Hook for search suggestions
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('titles')
        .select('id, title, title_english, image_url, year')
        .or(`title.ilike.%${query}%,title_english.ilike.%${query}%`)
        .limit(8)
        .order('popularity', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // Cache suggestions for 30 seconds
  });
}