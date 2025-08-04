import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentFilters {
  genre?: string;
  year?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

interface UseSimpleContentDataProps {
  contentType: 'anime' | 'manga';
  filters: ContentFilters;
  limit?: number;
}

export const useSimpleContentData = ({ contentType, filters, limit = 50 }: UseSimpleContentDataProps) => {
  return useQuery({
    queryKey: ['simple-content', contentType, filters, limit],
    queryFn: async () => {
      // Build the base query
      const baseSelect = `
        *,
        ${contentType === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
        title_genres(genres(name)),
        ${contentType === 'anime' ? 'title_studios(studios(name))' : 'title_authors(authors(name))'}
      `;

      const genreSelect = `
        *,
        ${contentType === 'anime' ? 'anime_details!inner(*)' : 'manga_details!inner(*)'},
        title_genres!inner(genres!inner(name)),
        ${contentType === 'anime' ? 'title_studios(studios(name))' : 'title_authors(authors(name))'}
      `;

      let query = supabase
        .from('titles')
        .select(filters.genre && filters.genre !== 'all' ? genreSelect : baseSelect);

      // Apply genre filter
      if (filters.genre && filters.genre !== 'all') {
        query = query.eq('title_genres.genres.name', filters.genre);
      }

      if (filters.year && filters.year !== 'all') {
        query = query.eq('year', parseInt(filters.year));
      }

      if (filters.status && filters.status !== 'all') {
        const statusColumn = contentType === 'anime' ? 'anime_details.status' : 'manga_details.status';
        query = query.eq(statusColumn, filters.status);
      }

      if (filters.search) {
        // Use ilike for search
        query = query.or(`title.ilike.%${filters.search}%,title_english.ilike.%${filters.search}%,title_japanese.ilike.%${filters.search}%`);
      }

      // Apply sorting with proper null handling
      const sortColumn = filters.sort_by || 'score';
      const sortOrder = filters.order || 'desc';
      
      if (sortColumn === 'score') {
        query = query.order(sortColumn, { 
          ascending: sortOrder === 'asc', 
          nullsFirst: false 
        });
      } else {
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
      }

      // Apply limit
      query = query.limit(limit);

      const { data, error } = await query;
      
      if (error) {
        console.error('Simple content data fetch error:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!contentType,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000)
  });
};