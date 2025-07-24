import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Loader2, X, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { AnimatePresence, motion } from 'framer-motion';

interface UnifiedSearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  onSelect?: (item: any) => void;
  showDropdown?: boolean;
  autoFocus?: boolean;
  contentType?: 'anime' | 'manga' | 'all';
  variant?: 'default' | 'compact' | 'hero';
}

export const UnifiedSearchBar = ({ 
  placeholder = "Search anime, manga...", 
  className,
  onSearch,
  onSelect,
  showDropdown = true,
  autoFocus = false,
  contentType = 'all',
  variant = 'default'
}: UnifiedSearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    query, 
    results, 
    isLoading, 
    search, 
    clearSearch,
    hasResults 
  } = useUnifiedSearch({ contentType, limit: showDropdown ? 5 : 20 });
  
  const { searchHistory, clearHistory } = useSearchHistory();
  
  // Popular searches for suggestions
  const popularSearches = [
    'One Piece', 'Naruto', 'Attack on Titan', 
    'My Hero Academia', 'Demon Slayer', 'Jujutsu Kaisen'
  ];
  
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
  
  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    search(value);
    
    if (showDropdown) {
      setIsOpen(value.length > 0 || searchHistory.length > 0);
    }
  };
  
  const handleSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    
    setIsOpen(false);
    
    if (onSearch) {
      onSearch(trimmedQuery);
    } else {
      navigate(`/${contentType === 'all' ? 'anime' : contentType}?search=${encodeURIComponent(trimmedQuery)}`);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };
  
  const handleResultClick = (result: any) => {
    setIsOpen(false);
    
    if (onSelect) {
      onSelect(result);
    } else {
      const path = result.type === 'manga' ? `/manga/${result.id}` : `/anime/${result.id}`;
      navigate(path);
    }
  };
  
  const variantStyles = {
    default: 'w-full',
    compact: 'w-64',
    hero: 'w-full max-w-2xl'
  };
  
  return (
    <div ref={searchRef} className={cn('relative', variantStyles[variant], className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className={cn(
            'pl-10 pr-10',
            variant === 'hero' && 'h-12 text-lg'
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
        )}
        {query && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSearch();
              setIsOpen(false);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <AnimatePresence>
        {showDropdown && isOpen && createPortal(
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: searchRef.current?.getBoundingClientRect().bottom || 0,
              left: searchRef.current?.getBoundingClientRect().left || 0,
              width: searchRef.current?.getBoundingClientRect().width || 0,
              marginTop: '8px',
              zIndex: 9999
            }}
            className="bg-background border rounded-lg shadow-lg overflow-hidden"
          >
            {/* Search Results */}
            {hasResults && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Search Results
                </div>
                {results.slice(0, 5).map((result) => (
                  <motion.div
                    key={result.id}
                    whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
                    onClick={() => handleResultClick(result)}
                    className="flex items-center gap-3 p-2 rounded cursor-pointer"
                  >
                    {result.image_url && (
                      <img 
                        src={result.image_url} 
                        alt={result.title}
                        className="w-10 h-14 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {result.type} • Score: {result.score || 'N/A'}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {results.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => handleSearch(query)}
                  >
                    View all {results.length} results
                  </Button>
                )}
              </div>
            )}
            
            {/* Recent Searches */}
            {!hasResults && searchHistory.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Recent Searches
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="h-6 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                {searchHistory.slice(0, 5).map((term, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      search(term);
                      handleSearch(term);
                    }}
                    className="px-2 py-1.5 text-sm hover:bg-muted rounded cursor-pointer"
                  >
                    {term}
                  </div>
                ))}
              </div>
            )}
            
            {/* Popular Searches */}
            {!hasResults && !query && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Popular Searches
                </div>
                <div className="flex flex-wrap gap-1 p-1">
                  {popularSearches.map((term) => (
                    <Badge
                      key={term}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => {
                        search(term);
                        handleSearch(term);
                      }}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* No Results */}
            {query && !hasResults && !isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No results found for "{query}"
              </div>
            )}
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};