import { create } from 'zustand';
import { AnimeContent, MangaContent } from '@/services/api';

export interface SearchFilters {
  contentType: 'anime' | 'manga' | 'both';
  genre?: string;
  genres?: string[];
  studios?: string[];
  authors?: string[];
  status?: string;
  type?: string;
  year?: string;
  year_min?: number;
  year_max?: number;
  season?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  score_min?: number;
  score_max?: number;
  episodes_min?: number;
  episodes_max?: number;
  chapters_min?: number;
  chapters_max?: number;
  streaming_platform?: string;
  streaming_platforms?: string[];
}

export interface SearchResult {
  anime: AnimeContent[];
  manga: MangaContent[];
  totalResults: number;
}

interface SearchState {
  // Current search query
  query: string;
  setQuery: (query: string) => void;
  
  // Search filters
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  
  // Search results
  results: SearchResult | null;
  setResults: (results: SearchResult | null) => void;
  
  // Search suggestions
  suggestions: string[];
  setSuggestions: (suggestions: string[]) => void;
  
  // Search history
  searchHistory: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
  
  // Loading state
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  
  // Search error
  searchError: string | null;
  setSearchError: (error: string | null) => void;
  
  // Recent searches (for quick access)
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Advanced search visibility
  showAdvancedSearch: boolean;
  setShowAdvancedSearch: (show: boolean) => void;
  
  // Clear all search data
  clearSearch: () => void;
}

const defaultFilters: SearchFilters = {
  contentType: 'both',
  sort_by: 'score',
  order: 'desc',
};

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  setQuery: (query) => set({ query }),
  
  filters: defaultFilters,
  setFilters: (newFilters) => 
    set((state) => ({ 
      filters: { ...state.filters, ...newFilters } 
    })),
  resetFilters: () => set({ filters: defaultFilters }),
  
  results: null,
  setResults: (results) => set({ results }),
  
  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  
  searchHistory: [],
  addToHistory: (query) => {
    const { searchHistory } = get();
    const trimmedQuery = query.trim();
    if (!trimmedQuery || searchHistory.includes(trimmedQuery)) return;
    
    const newHistory = [trimmedQuery, ...searchHistory.slice(0, 9)]; // Keep last 10
    set({ searchHistory: newHistory });
  },
  clearHistory: () => set({ searchHistory: [] }),
  removeFromHistory: (query) => {
    const { searchHistory } = get();
    set({ searchHistory: searchHistory.filter(q => q !== query) });
  },
  
  isSearching: false,
  setIsSearching: (searching) => set({ isSearching: searching }),
  
  searchError: null,
  setSearchError: (error) => set({ searchError: error }),
  
  recentSearches: [],
  addRecentSearch: (query) => {
    const { recentSearches } = get();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    
    const newRecent = [
      trimmedQuery,
      ...recentSearches.filter(q => q !== trimmedQuery).slice(0, 4)
    ];
    set({ recentSearches: newRecent });
  },
  clearRecentSearches: () => set({ recentSearches: [] }),
  
  showAdvancedSearch: false,
  setShowAdvancedSearch: (show) => set({ showAdvancedSearch: show }),
  
  clearSearch: () => set({
    query: '',
    results: null,
    suggestions: [],
    searchError: null,
    isSearching: false,
  }),
}));