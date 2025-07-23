import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';

// Types
interface SearchSuggestion {
  id: string;
  title: string;
  title_english?: string;
  image_url?: string;
  type: 'anime' | 'manga';
  score?: number;
}

interface PopularSearchTerm {
  term: string;
  count: number;
  category: 'anime' | 'manga' | 'genre';
}

// Local storage keys
const RECENT_SEARCHES_KEY = 'anithing_recent_searches';
const POPULAR_TERMS_KEY = 'anithing_popular_terms';
const PREFETCHED_TERMS_KEY = 'anithing_prefetched_terms';

// Search service for interacting with cached-content edge function
class OptimizedSearchService {
  private static instance: OptimizedSearchService;
  private recentSearches: string[] = [];
  private popularTerms: PopularSearchTerm[] = [];
  private suggestionCache = new Map<string, { data: SearchSuggestion[]; expires: number }>();
  private readonly SUGGESTION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): OptimizedSearchService {
    if (!OptimizedSearchService.instance) {
      OptimizedSearchService.instance = new OptimizedSearchService();
    }
    return OptimizedSearchService.instance;
  }

  constructor() {
    this.loadFromLocalStorage();
    this.prefetchPopularTerms();
  }

  // Load data from localStorage
  private loadFromLocalStorage() {
    try {
      const recent = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (recent) {
        this.recentSearches = JSON.parse(recent);
      }

      const popular = localStorage.getItem(POPULAR_TERMS_KEY);
      if (popular) {
        this.popularTerms = JSON.parse(popular);
      }
    } catch (error) {
      console.warn('Failed to load search data from localStorage:', error);
    }
  }

  // Save recent searches to localStorage
  private saveRecentSearches() {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
    } catch (error) {
      console.warn('Failed to save recent searches:', error);
    }
  }

  // Add to recent searches
  addRecentSearch(query: string) {
    if (!query.trim()) return;
    
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(term => term !== query);
    
    // Add to beginning
    this.recentSearches.unshift(query);
    
    // Keep only last 10
    this.recentSearches = this.recentSearches.slice(0, 10);
    
    this.saveRecentSearches();
  }

  // Get recent searches
  getRecentSearches(): string[] {
    return [...this.recentSearches];
  }

  // Clear recent searches
  clearRecentSearches() {
    this.recentSearches = [];
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }

  // Get search suggestions using cached-content edge function
  async getSearchSuggestions(query: string, limit = 8): Promise<SearchSuggestion[]> {
    if (!query.trim() || query.length < 2) return [];

    const cacheKey = `${query.toLowerCase()}_${limit}`;
    const cached = this.suggestionCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      // Use cached-content edge function for fast suggestions
      const { data, error } = await supabase.functions.invoke('cached-content', {
        body: {
          endpoint: 'search',
          contentType: 'anime',
          limit,
          filters: { query }
        }
      });

      if (error) throw error;

      const suggestions: SearchSuggestion[] = data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        title_english: item.title_english,
        image_url: item.image_url,
        type: 'anime' as const,
        score: item.score
      }));

      // Cache the results
      this.suggestionCache.set(cacheKey, {
        data: suggestions,
        expires: Date.now() + this.SUGGESTION_CACHE_TTL
      });

      return suggestions;
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  // Perform full search using cached-content edge function
  async search(query: string, contentType: 'anime' | 'manga' = 'anime', limit = 20) {
    if (!query.trim()) return { data: [], error: null };

    try {
      const { data, error } = await supabase.functions.invoke('cached-content', {
        body: {
          endpoint: 'search',
          contentType,
          limit,
          filters: { query }
        }
      });

      if (error) throw error;

      // Add to recent searches on successful search
      this.addRecentSearch(query);

      return { data: data.data, error: null };
    } catch (error) {
      console.error('Search failed:', error);
      return { data: [], error: error.message };
    }
  }

  // Prefetch popular search terms
  async prefetchPopularTerms() {
    // Check if we already have cached popular terms
    const cached = localStorage.getItem(PREFETCHED_TERMS_KEY);
    const now = Date.now();
    
    if (cached) {
      try {
        const { terms, expires } = JSON.parse(cached);
        if (expires > now) {
          this.popularTerms = terms;
          return;
        }
      } catch (error) {
        console.warn('Failed to parse cached popular terms:', error);
      }
    }

    // Prefetch popular anime/manga titles for suggestions
    const popularTerms = [
      'Naruto', 'One Piece', 'Attack on Titan', 'My Hero Academia',
      'Demon Slayer', 'Dragon Ball', 'Death Note', 'One Punch Man',
      'Fullmetal Alchemist', 'Hunter x Hunter', 'Bleach', 'Tokyo Ghoul',
      'Jujutsu Kaisen', 'Chainsaw Man', 'Mob Psycho', 'Spirited Away'
    ];

    this.popularTerms = popularTerms.map(term => ({
      term,
      count: Math.floor(Math.random() * 1000) + 100,
      category: 'anime' as const
    }));

    // Cache for 24 hours
    try {
      localStorage.setItem(PREFETCHED_TERMS_KEY, JSON.stringify({
        terms: this.popularTerms,
        expires: now + (24 * 60 * 60 * 1000)
      }));
    } catch (error) {
      console.warn('Failed to cache popular terms:', error);
    }
  }

  // Get popular search terms
  getPopularTerms(): PopularSearchTerm[] {
    return [...this.popularTerms];
  }

  // Clear suggestion cache
  clearSuggestionCache() {
    this.suggestionCache.clear();
  }
}

// Hook for optimized search with all features
export const useOptimizedSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularTerms, setPopularTerms] = useState<PopularSearchTerm[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchService = useMemo(() => OptimizedSearchService.getInstance(), []);

  // Debounced function to get suggestions (300ms delay)
  const debouncedGetSuggestions = useDebouncedCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const results = await searchService.getSearchSuggestions(searchQuery);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to get suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    },
    300
  );

  // Update query and trigger suggestions
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setShowSuggestions(newQuery.length >= 2);
    debouncedGetSuggestions(newQuery);
  }, [debouncedGetSuggestions]);

  // Perform search
  const performSearch = useCallback(async (searchQuery?: string, contentType: 'anime' | 'manga' = 'anime') => {
    const queryToUse = searchQuery || query;
    if (!queryToUse.trim()) return { data: [], error: null };

    const result = await searchService.search(queryToUse, contentType);
    
    // Update recent searches
    setRecentSearches(searchService.getRecentSearches());
    
    return result;
  }, [query, searchService]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    searchService.clearRecentSearches();
    setRecentSearches([]);
  }, [searchService]);

  // Load initial data
  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches());
    setPopularTerms(searchService.getPopularTerms());
  }, [searchService]);

  // Clear suggestions when query is empty
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  return {
    // State
    query,
    suggestions,
    recentSearches,
    popularTerms,
    isLoadingSuggestions,
    showSuggestions,

    // Actions
    updateQuery,
    setQuery: updateQuery,
    performSearch,
    clearRecentSearches,
    setShowSuggestions,

    // Utils
    clearSuggestionCache: () => searchService.clearSuggestionCache(),
    addRecentSearch: (term: string) => {
      searchService.addRecentSearch(term);
      setRecentSearches(searchService.getRecentSearches());
    }
  };
};

// Hook for search suggestions only (lighter weight)
export const useSearchSuggestions = (query: string, enabled = true) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchService = useMemo(() => OptimizedSearchService.getInstance(), []);

  const debouncedGetSuggestions = useDebouncedCallback(
    async (searchQuery: string) => {
      if (!enabled || !searchQuery.trim() || searchQuery.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchService.getSearchSuggestions(searchQuery);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to get suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    300
  );

  useEffect(() => {
    debouncedGetSuggestions(query);
  }, [query, debouncedGetSuggestions]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
    }
  }, [query]);

  return {
    data: suggestions,
    isLoading,
    error: null
  };
};
