import { useCallback } from 'react';
import { useSearchStore } from '@/store';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';

export const useSearch = () => {
  const {
    query,
    setQuery,
    filters,
    setFilters,
    resetFilters,
    results,
    setResults,
    suggestions,
    setSuggestions,
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory,
    isSearching,
    setIsSearching,
    searchError,
    setSearchError,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    showAdvancedSearch,
    setShowAdvancedSearch,
    clearSearch,
  } = useSearchStore();

  // Use the unified search hook
  const unifiedSearch = useUnifiedSearch();

  // Enhanced search function that integrates with store
  const search = useCallback(async (searchQuery?: string) => {
    const queryToUse = searchQuery || query;
    if (!queryToUse.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      await unifiedSearch.search({
        query: queryToUse,
        type: filters.contentType,
        limit: 20,
        genres: filters.genre ? [filters.genre] : undefined,
        year: filters.year,
        status: filters.status,
        sort_by: filters.sort_by,
        order: filters.order
      });

      // Update store with results
      if (unifiedSearch.results) {
        setResults(unifiedSearch.results);
        addToHistory(queryToUse);
        addRecentSearch(queryToUse);
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, unifiedSearch, setIsSearching, setSearchError, setResults, addToHistory, addRecentSearch, clearSearch]);

  // Get suggestions function
  const getSuggestions = useCallback(async (searchQuery: string) => {
    try {
      await unifiedSearch.getSuggestions(searchQuery);
      setSuggestions(unifiedSearch.suggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  }, [unifiedSearch, setSuggestions]);

  // Update query and trigger search
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.trim()) {
      getSuggestions(newQuery);
    } else {
      setSuggestions([]);
    }
  }, [setQuery, getSuggestions, setSuggestions]);

  // Update filters and trigger search if there's a query
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
    if (query.trim()) {
      search();
    }
  }, [setFilters, query, search]);

  return {
    // State
    query,
    filters,
    results: results || unifiedSearch.results,
    suggestions,
    searchHistory,
    recentSearches,
    isSearching: isSearching || unifiedSearch.loading,
    searchError: searchError || (unifiedSearch.error?.message || null),
    showAdvancedSearch,

    // Actions
    setQuery: updateQuery,
    search,
    setFilters: updateFilters,
    resetFilters,
    getSuggestions,
    addToHistory,
    clearHistory,
    removeFromHistory,
    addRecentSearch,
    clearRecentSearches,
    setShowAdvancedSearch,
    clearSearch,

    // Legacy compatibility
    clearResults: () => setResults(null),
  };
};