import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { useRealTimeSearch } from "@/hooks/useRealTimeSearch";
import { cn } from "@/lib/utils";

interface SearchDropdownProps {
  className?: string;
  placeholder?: string;
}

export const SearchDropdown = ({ className, placeholder = "Search anime..." }: SearchDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { query, isSearching, searchResults, handleInputChange, clearSearch } = useRealTimeSearch();

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
    setIsOpen(value.length >= 2);
  };

  const handleResultClick = (anime: any) => {
    navigate(`/anime/${anime.id}`);
    setIsOpen(false);
    clearSearch();
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
          {isSearching ? (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Searching anime...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/50">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </div>
              {searchResults.map((anime) => (
                <div 
                  key={anime.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/20 last:border-b-0"
                  onClick={() => handleResultClick(anime)}
                >
                  {anime.image_url && (
                    <img 
                      src={anime.image_url} 
                      alt={anime.title}
                      className="w-12 h-16 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1 text-foreground">
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
                          ★ {anime.score}
                        </Badge>
                      )}
                      {anime.type && (
                        <Badge variant="outline" className="text-xs">
                          {anime.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No anime found for "{query}"
              <div className="mt-2 text-xs">
                Try searching for popular titles like "Naruto", "Attack on Titan", or "One Piece"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};