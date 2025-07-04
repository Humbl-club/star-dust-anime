import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchResult {
  results: any[];
  searchType: 'instant' | 'database' | 'fallback';
  query: string;
  totalResults: number;
}

export const useOptimizedSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [lastSearchInfo, setLastSearchInfo] = useState<SearchResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchCacheRef = useRef<Map<string, any[]>>(new Map());
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const optimizedSearch = async (
    query: string, 
    contentType: 'anime' | 'manga' = 'anime', 
    limit = 20
  ) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setLastSearchInfo(null);
      return [];
    }

    const trimmedQuery = query.trim().toLowerCase();
    
    // Check cache first
    const cacheKey = `${contentType}-${trimmedQuery}-${limit}`;
    if (searchCacheRef.current.has(cacheKey)) {
      const cachedResults = searchCacheRef.current.get(cacheKey)!;
      setSearchResults(cachedResults);
      setLastSearchInfo({
        results: cachedResults,
        searchType: 'instant',
        query: trimmedQuery,
        totalResults: cachedResults.length
      });
      return cachedResults;
    }

    setIsSearching(true);
    
    try {
      // Optimized database search with proper indexing
      const { data: results, error, count } = await supabase
        .from(contentType)
        .select('*', { count: 'exact' })
        .or(`title.ilike.%${trimmedQuery}%,title_english.ilike.%${trimmedQuery}%,title_japanese.ilike.%${trimmedQuery}%`)
        .order('popularity', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Search error:', error);
        toast.error('Search failed. Please try again.');
        return [];
      }

      const searchResults = results || [];
      
      // Cache the results
      searchCacheRef.current.set(cacheKey, searchResults);
      
      // Clean cache if it gets too large
      if (searchCacheRef.current.size > 100) {
        const oldestKey = searchCacheRef.current.keys().next().value;
        searchCacheRef.current.delete(oldestKey);
      }

      setSearchResults(searchResults);
      setLastSearchInfo({
        results: searchResults,
        searchType: 'database',
        query: trimmedQuery,
        totalResults: count || 0
      });

      if (searchResults.length > 0) {
        saveRecentSearch(query);
      }

      return searchResults;
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = (
    query: string,
    contentType: 'anime' | 'manga' = 'anime',
    limit = 20,
    delay = 300
  ) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      optimizedSearch(query, contentType, limit);
    }, delay);
  };

  const clearSearch = () => {
    setSearchResults([]);
    setLastSearchInfo(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  const clearCache = () => {
    searchCacheRef.current.clear();
  };

  const removeRecentSearch = (query: string) => {
    const updated = recentSearches.filter(q => q !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  return {
    optimizedSearch,
    debouncedSearch,
    isSearching,
    searchResults,
    lastSearchInfo,
    recentSearches,
    clearSearch,
    clearCache,
    removeRecentSearch
  };
};