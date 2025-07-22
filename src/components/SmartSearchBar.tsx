import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';

type SearchMode = 'title' | 'genre' | 'year';

interface SmartSearchBarProps {
  onSearch?: (query: string, mode: SearchMode) => void;
  className?: string;
}

export function SmartSearchBar({ onSearch, className }: SmartSearchBarProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('title');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  const saveSearch = (query: string) => {
    if (!query.trim()) return;
    
    try {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      onSearch?.(query, searchMode);
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const handleSearch = (query: string) => {
    saveSearch(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getPlaceholder = () => {
    switch (searchMode) {
      case 'title': return 'Search by title...';
      case 'genre': return 'Search by genre...';
      case 'year': return 'Search by year...';
      default: return 'Search...';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search mode selector */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={searchMode === 'title' ? 'default' : 'outline'}
          onClick={() => setSearchMode('title')}
        >
          Title
        </Button>
        <Button
          size="sm"
          variant={searchMode === 'genre' ? 'default' : 'outline'}
          onClick={() => setSearchMode('genre')}
        >
          Genre
        </Button>
        <Button
          size="sm"
          variant={searchMode === 'year' ? 'default' : 'outline'}
          onClick={() => setSearchMode('year')}
        >
          Year
        </Button>
      </div>

      {/* Search input with autocomplete */}
      <SearchAutocomplete 
        placeholder={getPlaceholder()}
        onSearch={handleSearch}
      />

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Recent searches:</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearRecentSearches}
              className="text-xs h-6 px-2"
            >
              Clear
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.map((search) => (
              <Button
                key={search}
                size="sm"
                variant="ghost"
                onClick={() => handleSearch(search)}
                className="h-8 px-3 text-sm"
              >
                {search}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}