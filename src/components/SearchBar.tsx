import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Loader2, X, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/hooks/useSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  showDropdown?: boolean;
  autoFocus?: boolean;
}

export const SearchBar = ({ 
  placeholder = "Search anime...", 
  className,
  onSearch,
  showDropdown = true,
  autoFocus = false
}: SearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { query, setQuery, results, isLoading, search } = useSearch();
  const { searchHistory, addToHistory, removeFromHistory } = useSearchHistory();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setQuery(value);
    
    if (showDropdown) {
      setIsOpen(value.length >= 2 || searchHistory.length > 0);
    }
  };

  const handleInputFocus = () => {
    if (showDropdown) {
      setIsOpen(inputValue.length >= 2 || searchHistory.length > 0);
    }
  };

  const handleSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    addToHistory(trimmedQuery);
    setInputValue(trimmedQuery);
    setIsOpen(false);

    if (onSearch) {
      onSearch(trimmedQuery);
    } else {
      navigate(`/anime?search=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(inputValue);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleResultClick = (result: any) => {
    const path = result.type === 'manga' ? `/manga/${result.id}` : `/anime/${result.id}`;
    navigate(path);
    setIsOpen(false);
    setInputValue('');
  };

  const handleHistoryClick = (historyQuery: string) => {
    handleSearch(historyQuery);
  };

  const handleClearInput = () => {
    setInputValue('');
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const showDropdownContent = isOpen && (inputValue.length >= 2 || searchHistory.length > 0);
  const hasResults = results && results.length > 0;
  const showNoResults = inputValue.length >= 2 && !isLoading && !hasResults;

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-20 glass-input"
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          {inputValue && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClearInput}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdownContent && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card border border-primary/20 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-2 space-y-2">
            
            {/* Search Results */}
            {inputValue.length >= 2 && (
              <>
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Searching...</span>
                    </div>
                  </div>
                )}

                {showNoResults && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No results found</p>
                      <p className="text-xs">Try a different search term</p>
                    </div>
                  </div>
                )}

                {hasResults && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Results
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {results.slice(0, 5).map((result: any) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          {result.image_url && (
                            <img
                              src={result.image_url}
                              alt={result.title}
                              className="w-8 h-8 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {result.type || 'anime'}
                              </Badge>
                              {result.score && (
                                <span className="text-xs text-muted-foreground">
                                  ⭐ {result.score}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && inputValue.length < 2 && (
              <>
                {inputValue.length >= 2 && <Separator />}
                <div className="space-y-1">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Recent Searches
                  </div>
                  <div className="space-y-1">
                    {searchHistory.map((historyItem) => (
                      <div key={historyItem} className="flex items-center justify-between">
                        <button
                          onClick={() => handleHistoryClick(historyItem)}
                          className="flex-1 flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{historyItem}</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-50 hover:opacity-100"
                          onClick={() => removeFromHistory(historyItem)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};