import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, X } from "lucide-react";
import { useSimpleSearch } from "@/hooks/useSimpleSearch";
import { cn } from "@/lib/utils";

interface WorkingSearchDropdownProps {
  className?: string;
  placeholder?: string;
  onResultClick?: () => void;
}

export const WorkingSearchDropdown = ({ 
  className, 
  placeholder = "Search anime...",
  onResultClick 
}: WorkingSearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { query, isSearching, searchResults, handleInputChange, clearSearch } = useSimpleSearch();

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

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange_ = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleInputChange(value);
    setIsOpen(value.length >= 2 || searchResults.length > 0);
  };

  const handleResultClick = (anime: any) => {
    console.log('🎯 Clicked on anime:', anime.title);
    navigate(`/anime/${anime.id}`);
    setIsOpen(false);
    clearSearch();
    inputRef.current?.blur();
    onResultClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      handleResultClick(searchResults[0]);
    }
  };

  const handleClearSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearch();
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && (query.length >= 2 || searchResults.length > 0);

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange_}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 bg-background/95 backdrop-blur-md border border-border/50 focus:border-primary/50 transition-colors"
        />
        {/* Loading or Clear button */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : query.length > 0 ? (
            <button
              onClick={handleClearSearch}
              className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
          {isSearching && searchResults.length === 0 ? (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Searching for "{query}"...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/50 flex items-center justify-between">
                <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</span>
                <span className="text-primary">"{query}"</span>
              </div>
              {searchResults.map((anime, index) => (
                <div 
                  key={anime.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/20 last:border-b-0 group"
                  onClick={() => handleResultClick(anime)}
                >
                  {anime.image_url && (
                    <div className="relative">
                      <img 
                        src={anime.image_url} 
                        alt={anime.title}
                        className="w-12 h-16 object-cover rounded flex-shrink-0 group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                      {anime.title}
                    </h4>
                    {anime.title_english && anime.title_english !== anime.title && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {anime.title_english}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {anime.score && (
                        <Badge variant="secondary" className="text-xs">
                          ⭐ {anime.score}
                        </Badge>
                      )}
                      {anime.type && (
                        <Badge variant="outline" className="text-xs">
                          {anime.type}
                        </Badge>
                      )}
                      {anime.popularity && (
                        <span className="text-xs text-muted-foreground">
                          {anime.popularity.toLocaleString()} fans
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <p>No anime found for "{query}"</p>
              <div className="mt-2 text-xs text-muted-foreground/70">
                Try searching for popular titles like:<br />
                "Naruto", "Attack on Titan", "One Piece", "Dragon Ball"
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};