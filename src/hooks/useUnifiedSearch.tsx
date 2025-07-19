import { useState, useCallback } from 'react';
import { searchService, AnimeContent, MangaContent } from '@/services/api';

export interface SearchResult {
  anime: AnimeContent[];
  manga: MangaContent[];
  totalResults: number;
}

export interface UseUnifiedSearchOptions {
  query: string;
  type?: 'anime' | 'manga' | 'both';
  limit?: number;
  genres?: string[];
  year?: string;
  status?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  autoSearch?: boolean;
}

export interface UseUnifiedSearchReturn {
  results: SearchResult | null;
  suggestions: string[];
  loading: boolean;
  error: Error | null;
  search: (options: UseUnifiedSearchOptions) => Promise<void>;
  getSuggestions: (query: string) => Promise<void>;
  clearResults: () => void;
}

export function useUnifiedSearch(): UseUnifiedSearchReturn {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (options: UseUnifiedSearchOptions) => {
    if (!options.query.trim()) {
      setResults({ anime: [], manga: [], totalResults: 0 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchService.globalSearch(options);
      
      if (response.success) {
        setResults(response.data);
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await searchService.getSearchSuggestions(query, 5);
      
      if (response.success) {
        setSuggestions(response.data);
      }
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    results,
    suggestions,
    loading,
    error,
    search,
    getSuggestions,
    clearResults
  };
}