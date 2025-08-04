import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { useSearchStore } from '@/store/searchStore';
import { toast } from '@/hooks/use-toast';

export interface UnifiedSearchOptions {
  contentType?: 'anime' | 'manga' | 'all';
  limit?: number;
  filters?: {
    genre?: string;
    year?: string;
    status?: string;
    type?: string;
    sort_by?: string;
    order?: 'asc' | 'desc';
  };
}

export const useUnifiedSearch = (options: UnifiedSearchOptions = {}) => {
  const { 
    query: globalQuery, 
    setQuery: setGlobalQuery,
    addToHistory,
    clearSearch: clearGlobalSearch 
  } = useSearchStore();
  
  const [localQuery, setLocalQuery] = useState('');
  const [debouncedQuery] = useDebounce(localQuery || globalQuery, 300);
  
  const searchFunction = useCallback(async () => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    
    try {
      // Use cached-content edge function for optimal performance
      const { data, error } = await supabase.functions.invoke('cached-content', {
        body: {
          endpoint: 'search',
          query: debouncedQuery,
          contentType: options.contentType || 'all',
          limit: options.limit || 20,
          filters: options.filters
        }
      });
      
      if (error) throw error;
      
      // Add to search history
      if (debouncedQuery.length >= 2) {
        addToHistory(debouncedQuery);
      }
      
      // Return the data array from the response
      return data?.data || [];
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Search failed. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  }, [debouncedQuery, options, addToHistory]);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['unified-search', debouncedQuery, options],
    queryFn: searchFunction,
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
  
  // Local search function for components that need local state
  const search = useCallback((searchQuery: string) => {
    setLocalQuery(searchQuery);
    setGlobalQuery(searchQuery);
  }, [setGlobalQuery]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setLocalQuery('');
    clearGlobalSearch();
  }, [clearGlobalSearch]);
  
  return {
    // Query state
    query: localQuery || globalQuery,
    debouncedQuery,
    
    // Results
    results: data || [],
    isLoading: isLoading && debouncedQuery.length >= 2,
    error,
    
    // Actions
    search,
    setQuery: search, // Alias for compatibility
    clearSearch,
    refetch,
    
    // Metadata
    hasResults: (data?.length || 0) > 0,
    isSearching: isLoading && debouncedQuery.length >= 2,
    canSearch: debouncedQuery.length >= 2
  };
};