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
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10 group-focus-within:text-primary transition-colors" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange_}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-12 h-14 text-lg glass-search rounded-2xl focus:ring-0 focus:outline-none transition-all duration-300"
        />
        {/* Loading or Clear button */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : query.length > 0 ? (
            <button
              onClick={handleClearSearch}
              className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors spring-bounce rounded-full hover:bg-muted/30 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <>
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[998]" onClick={() => setIsOpen(false)} />
          
          <div className="absolute top-full left-0 right-0 mt-3 glass-dropdown rounded-2xl shadow-2xl max-h-96 overflow-y-auto z-[999] animate-fade-in border border-primary/20"
               style={{ backgroundColor: 'hsl(var(--background) / 0.95)' }}>
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
                  className="flex items-center gap-4 p-4 hover:bg-primary/5 cursor-pointer transition-all duration-200 border-b border-border/10 last:border-b-0 group spring-bounce"
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
        </>
      )}
    </div>
  );
};