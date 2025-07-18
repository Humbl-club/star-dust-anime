import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  title: string;
  title_english?: string;
  image_url?: string;
  score?: number;
  type?: string;
  popularity?: number;
}

interface SearchResultsProps {
  query: string;
  isSearching: boolean;
  searchResults: SearchResult[];
  onResultClick: (anime: SearchResult) => void;
  onBackdropClick: () => void;
}

export const SearchResults = ({
  query,
  isSearching,
  searchResults,
  onResultClick,
  onBackdropClick
}: SearchResultsProps) => {
  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[998]" onClick={onBackdropClick} />
      
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
            {searchResults.map((anime) => (
              <div 
                key={anime.id}
                className="flex items-center gap-4 p-4 hover:bg-primary/5 cursor-pointer transition-all duration-200 border-b border-border/10 last:border-b-0 group spring-bounce"
                onClick={() => onResultClick(anime)}
              >
                {anime.image_url && (
                  <div className="relative">
                    <img 
                      src={anime.image_url} 
                      alt={anime.title}
                      loading="lazy"
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
  );
};