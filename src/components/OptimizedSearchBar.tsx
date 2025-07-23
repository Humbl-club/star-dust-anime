import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Types
interface SearchSuggestion {
  id: string;
  title: string;
  title_english?: string;
  image_url?: string;
  type: 'anime' | 'manga';
  score?: number;
}

interface OptimizedSearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  onSelect?: (item: any) => void;
  autoFocus?: boolean;
  showPopularTerms?: boolean;
}

// Local storage keys
const RECENT_SEARCHES_KEY = 'anithing_recent_searches';

export const OptimizedSearchBar = ({
  placeholder = "Search anime, manga...",
  className,
  onSearch,
  onSelect,
  autoFocus = false,
  showPopularTerms = true
}: OptimizedSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Popular terms
  const popularTerms = [
    'Naruto', 'One Piece', 'Attack on Titan', 'My Hero Academia',
    'Demon Slayer', 'Dragon Ball', 'Death Note', 'One Punch Man'
  ];

  // Load recent searches on mount
  useEffect(() => {
    try {
      const recent = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  }, []);

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
        const { data, error } = await supabase.functions.invoke('cached-content', {
          body: {
            endpoint: 'search',
            contentType: 'anime',
            limit: 8,
            filters: { query: searchQuery }
          }
        });

        if (!error && data?.data) {
          const searchSuggestions: SearchSuggestion[] = data.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            title_english: item.title_english,
            image_url: item.image_url,
            type: 'anime' as const,
            score: item.score
          }));
          setSuggestions(searchSuggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Failed to get suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    },
    300
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const addRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const newRecentSearches = [searchTerm, ...recentSearches.filter(term => term !== searchTerm)].slice(0, 10);
    setRecentSearches(newRecentSearches);
    
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecentSearches));
    } catch (error) {
      console.warn('Failed to save recent searches:', error);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length >= 2);
    debouncedGetSuggestions(value);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleSearch = async (searchQuery?: string) => {
    const queryToUse = searchQuery || query;
    if (!queryToUse.trim()) return;

    addRecentSearch(queryToUse);
    setShowSuggestions(false);
    setIsFocused(false);
    onSearch?.(queryToUse);
    
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    addRecentSearch(suggestion.title);
    setShowSuggestions(false);
    setIsFocused(false);
    onSelect?.(suggestion);
  };

  const handleRecentSearchClick = (term: string) => {
    setQuery(term);
    handleSearch(term);
  };

  const handlePopularTermClick = (term: string) => {
    setQuery(term);
    handleSearch(term);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setIsFocused(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const clearInput = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const shouldShowDropdown = isFocused && (
    showSuggestions || 
    recentSearches.length > 0 || 
    (showPopularTerms && popularTerms.length > 0)
  );

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className={cn(
        "relative flex items-center w-full rounded-lg border border-input bg-background",
        "transition-all duration-200",
        isFocused && "ring-2 ring-ring ring-offset-2"
      )}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "flex h-11 w-full bg-transparent px-10 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />

        {query && (
          <button
            onClick={clearInput}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {shouldShowDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
            {/* Loading */}
            {isLoadingSuggestions && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            )}

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Suggestions
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    {suggestion.image_url && (
                      <img
                        src={suggestion.image_url}
                        alt={suggestion.title}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {suggestion.title}
                      </div>
                      {suggestion.title_english && suggestion.title_english !== suggestion.title && (
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.title_english}
                        </div>
                      )}
                    </div>
                    {suggestion.score && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.score}
                      </Badge>
                    )}
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && suggestions.length === 0 && !isLoadingSuggestions && (
              <div>
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Recent Searches
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                </div>
                {recentSearches.slice(0, 5).map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(term)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">{term}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            )}

            {/* Popular Terms */}
            {showPopularTerms && popularTerms.length > 0 && suggestions.length === 0 && !isLoadingSuggestions && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Popular Searches
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {popularTerms.slice(0, 8).map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handlePopularTermClick(term)}
                      className="flex items-center gap-2 px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    >
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs truncate">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {!isLoadingSuggestions && suggestions.length === 0 && query.length >= 2 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No suggestions found for "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};