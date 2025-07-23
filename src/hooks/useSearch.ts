import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { useSearchHistory } from '@/hooks/useSearchHistory';

export interface SearchResult {
  id: string;
  title: string;
  image_url?: string;
  score?: number;
  type: 'anime' | 'manga';
}

export const useSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery] = useDebounce(query, 300);
  const { addToHistory } = useSearchHistory();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      
      const { data, error } = await supabase.functions.invoke('cached-content', {
        body: {
          type: 'search',
          query: debouncedQuery,
          contentType: 'anime',
          limit: 20
        }
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  // Search function for compatibility with existing components
  const search = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim().length >= 2) {
      addToHistory(searchQuery.trim());
    }
  };

  // Clear search function
  const clearSearch = () => {
    setQuery('');
  };
  
  return { 
    query, 
    setQuery, 
    results: data || [], 
    isLoading: isLoading && debouncedQuery.length >= 2,
    isSearching: isLoading && debouncedQuery.length >= 2, // Alias for compatibility
    error,
    search,
    clearSearch
  };
};