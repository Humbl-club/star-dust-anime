import { useState, useCallback, useMemo, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useWebWorker } from './useWebWorker';
import { usePerformanceMonitoring } from './usePerformanceMonitoring';

interface SearchCacheEntry {
  query: string;
  results: any[];
  timestamp: number;
  filters: Record<string, any>;
}

interface UseEnhancedSearchOptions {
  debounceMs?: number;
  cacheSize?: number;
  enableWorker?: boolean;
}

export const useEnhancedSearch = (options: UseEnhancedSearchOptions = {}) => {
  const {
    debounceMs = 300,
    cacheSize = 50,
    enableWorker = true
  } = options;

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cacheRef = useRef<Map<string, SearchCacheEntry>>(new Map());
  const { markStart, markEnd } = usePerformanceMonitoring();

  // Web worker for heavy search processing
  const { executeTask: executeSearchTask } = useWebWorker({
    workerPath: '../workers/dataProcessor.ts',
    fallbackFunction: async (task) => {
      // Fallback search processing on main thread
      const { data, options } = task;
      return {
        data: data.filter((item: any) => 
          item.title?.toLowerCase().includes(options.search?.toLowerCase() || '')
        ),
        total: data.length
      };
    }
  });

  // Cache management
  const getCacheKey = useCallback((query: string, filters: Record<string, any>) => {
    return `${query}-${JSON.stringify(filters)}`;
  }, []);

  const getFromCache = useCallback((query: string, filters: Record<string, any>) => {
    const key = getCacheKey(query, filters);
    const entry = cacheRef.current.get(key);
    
    if (entry && Date.now() - entry.timestamp < 5 * 60 * 1000) { // 5 minute cache
      return entry.results;
    }
    
    return null;
  }, [getCacheKey]);

  const saveToCache = useCallback((query: string, filters: Record<string, any>, results: any[]) => {
    const key = getCacheKey(query, filters);
    
    // Manage cache size
    if (cacheRef.current.size >= cacheSize) {
      const oldestKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(oldestKey);
    }
    
    cacheRef.current.set(key, {
      query,
      results,
      timestamp: Date.now(),
      filters
    });
  }, [getCacheKey, cacheSize]);

  // Search function with caching and worker support
  const performSearch = useCallback(async (
    query: string,
    data: any[],
    filters: Record<string, any> = {}
  ) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    markStart('search-operation');
    setIsSearching(true);

    try {
      // Check cache first
      const cachedResults = getFromCache(query, filters);
      if (cachedResults) {
        setSearchResults(cachedResults);
        markEnd('search-operation');
        setIsSearching(false);
        return;
      }

      // Use web worker for search processing if enabled
      const searchOptions = {
        search: query,
        ...filters
      };

      let results;
      if (enableWorker) {
        const workerResult = await executeSearchTask('filterAndSort', data, searchOptions);
        results = workerResult?.data || [];
      } else {
        // Fallback to main thread
        results = data.filter(item => 
          item.title?.toLowerCase().includes(query.toLowerCase()) ||
          item.title_english?.toLowerCase().includes(query.toLowerCase()) ||
          item.title_japanese?.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Cache results
      saveToCache(query, filters, results);
      setSearchResults(results);
      markEnd('search-operation');
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      markEnd('search-operation');
    } finally {
      setIsSearching(false);
    }
  }, [getFromCache, saveToCache, executeSearchTask, enableWorker, markStart, markEnd]);

  // Debounced search to reduce API calls and improve performance
  const debouncedSearch = useDebouncedCallback(performSearch, debounceMs);

  // Search suggestions with fuzzy matching
  const getSearchSuggestions = useCallback((query: string, data: any[], maxSuggestions = 5) => {
    if (!query.trim() || query.length < 2) return [];

    const queryLower = query.toLowerCase();
    const suggestions = data
      .filter(item => 
        item.title?.toLowerCase().includes(queryLower) ||
        item.title_english?.toLowerCase().includes(queryLower)
      )
      .slice(0, maxSuggestions)
      .map(item => ({
        id: item.id,
        title: item.title || item.title_english,
        image_url: item.image_url,
        type: item.anime_details ? 'anime' : 'manga'
      }));

    return suggestions;
  }, []);

  // Clear search and cache
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Search statistics
  const searchStats = useMemo(() => ({
    cacheSize: cacheRef.current.size,
    maxCacheSize: cacheSize,
    isWorkerEnabled: enableWorker,
    currentQuery: searchQuery
  }), [cacheSize, enableWorker, searchQuery]);

  return {
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    performSearch: debouncedSearch,
    getSearchSuggestions,
    clearSearch,
    clearCache,
    searchStats
  };
};