import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Search, Youtube, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrailerPreview } from "./TrailerPreview";
import { youtubeService, YouTubeSearchResult } from "@/services/youtube";
import { toast } from "sonner";

interface TrailerDiscoveryProps {
  animeTitle: string;
  onTrailerSelect?: (videoId: string, title: string) => void;
  className?: string;
}

export const TrailerDiscovery = ({ 
  animeTitle, 
  onTrailerSelect,
  className = "" 
}: TrailerDiscoveryProps) => {
  const [trailers, setTrailers] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(animeTitle);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search handler
  const debouncedSearchTrailers = useDebouncedCallback((query: string) => {
    searchTrailers(query);
  }, 300);

  const searchTrailers = async (query: string = searchQuery) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const results = await youtubeService.searchTrailers(query, 6);
      setTrailers(results);
      setHasSearched(true);
      
      if (results.length === 0) {
        toast.info("No trailers found. Try a different search term.");
      }
    } catch (error) {
      console.error('Trailer search error:', error);
      toast.error("Failed to search for trailers");
    } finally {
      setLoading(false);
    }
  };

  const handleTrailerSelect = (trailer: YouTubeSearchResult) => {
    if (onTrailerSelect) {
      onTrailerSelect(trailer.id.videoId, trailer.snippet.title);
      toast.success("Trailer selected!");
    }
  };

  // Auto-search on mount
  useEffect(() => {
    if (animeTitle && !hasSearched) {
      searchTrailers(animeTitle);
    }
  }, [animeTitle]);

  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold">Discover Trailers</h3>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  debouncedSearchTrailers(e.target.value);
                }}
                placeholder="Search for trailers..."
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && searchTrailers()}
              />
            </div>
            <Button 
              onClick={() => searchTrailers()}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Results */}
          {hasSearched && (
            <div className="space-y-3">
              {trailers.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {trailers.length} trailer{trailers.length !== 1 ? 's' : ''} found
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {trailers.map((trailer) => (
                      <div 
                        key={trailer.id.videoId}
                        className="space-y-2"
                      >
                        <TrailerPreview
                          videoId={trailer.id.videoId}
                          title={trailer.snippet.title}
                          thumbnail={trailer.snippet.thumbnails.high.url}
                          size="sm"
                        />
                        
                        {onTrailerSelect && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleTrailerSelect(trailer)}
                          >
                            Select This Trailer
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Youtube className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No trailers found</p>
                  <p className="text-xs">Try searching with a different term</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};