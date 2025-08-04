import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Tv, ExternalLink, Loader2 } from 'lucide-react';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { AnimeCard } from '@/components/features/AnimeCard';
import { MangaCard } from '@/components/features/MangaCard';
import { useNamePreference } from '@/hooks/useNamePreference';

const STREAMING_PLATFORMS = [
  { id: 'crunchyroll', name: 'Crunchyroll', color: 'bg-orange-500', searchUrl: 'https://www.crunchyroll.com/search?q=' },
  { id: 'netflix', name: 'Netflix', color: 'bg-red-600', searchUrl: 'https://www.netflix.com/search?q=' },
  { id: 'hulu', name: 'Hulu', color: 'bg-green-500', searchUrl: 'https://www.hulu.com/search?q=' },
  { id: 'funimation', name: 'Funimation', color: 'bg-purple-600', searchUrl: 'https://www.funimation.com/search/?q=' },
  { id: 'amazon-prime', name: 'Amazon Prime Video', color: 'bg-blue-600', searchUrl: 'https://www.amazon.com/s?k=' },
  { id: 'disney-plus', name: 'Disney Plus', color: 'bg-blue-800', searchUrl: 'https://www.disneyplus.com/search?q=' },
  { id: 'hidive', name: 'HIDIVE', color: 'bg-yellow-500', searchUrl: 'https://www.hidive.com/search?q=' }
];

export function StreamingSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getDisplayName } = useNamePreference();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedPlatform, setSelectedPlatform] = useState(searchParams.get('platform') || '');
  const [contentType, setContentType] = useState<'anime' | 'manga' | 'all'>(
    (searchParams.get('type') as 'anime' | 'manga' | 'all') || 'anime'
  );

  const { results, isLoading, search } = useUnifiedSearch({
    contentType,
    filters: {
      streaming_platform: selectedPlatform || undefined
    }
  });

  useEffect(() => {
    if (query) {
      search(query);
    }
  }, [query, selectedPlatform, contentType, search]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedPlatform) params.set('platform', selectedPlatform);
    if (contentType !== 'anime') params.set('type', contentType);
    setSearchParams(params);
    
    if (query) {
      search(query);
    }
  };

  const handlePlatformSearch = (title: string, platformId: string) => {
    const platform = STREAMING_PLATFORMS.find(p => p.id === platformId);
    if (platform) {
      window.open(platform.searchUrl + encodeURIComponent(title), '_blank');
    }
  };

  const selectedPlatformData = STREAMING_PLATFORMS.find(p => p.id === selectedPlatform);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Tv className="w-10 h-10 text-primary" />
            Streaming Platform Search
          </h1>
          <p className="text-muted-foreground text-lg">
            Find anime and manga, then search for them on your favorite streaming platforms
          </p>
        </div>

        {/* Search Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for anime or manga..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={!query.trim()}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="All streaming platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All platforms</SelectItem>
                    {STREAMING_PLATFORMS.map(platform => (
                      <SelectItem key={platform.id} value={platform.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                          {platform.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={contentType} onValueChange={(value: 'anime' | 'manga' | 'all') => setContentType(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="manga">Manga</SelectItem>
                  <SelectItem value="all">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPlatformData && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-3 h-3 rounded-full ${selectedPlatformData.color}`} />
                Filtering results that may be available on {selectedPlatformData.name}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Platforms Quick Access */}
        {!query && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Popular Streaming Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STREAMING_PLATFORMS.slice(0, 4).map(platform => (
                  <Button
                    key={platform.id}
                    variant="outline"
                    onClick={() => setSelectedPlatform(platform.id)}
                    className="h-auto p-4 flex-col gap-2"
                  >
                    <div className={`w-4 h-4 rounded-full ${platform.color}`} />
                    <span className="text-sm">{platform.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {query && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Search Results</span>
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              </CardTitle>
              {results.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Found {results.length} results for "{query}"
                  {selectedPlatformData && ` on ${selectedPlatformData.name}`}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {isLoading && results.length === 0 ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((item: any) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex gap-4">
                        <img
                          src={item.image_url}
                          alt={getDisplayName(item)}
                          className="w-16 h-24 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">
                            {getDisplayName(item)}
                          </h3>
                          {item.synopsis && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {item.synopsis}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.score && (
                              <Badge variant="secondary">
                                ⭐ {item.score}
                              </Badge>
                            )}
                            {item.year && (
                              <Badge variant="outline">
                                {item.year}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {item.type || (item.anime_details ? 'Anime' : 'Manga')}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {STREAMING_PLATFORMS.map(platform => (
                              <Button
                                key={platform.id}
                                size="sm"
                                variant="outline"
                                onClick={() => handlePlatformSearch(getDisplayName(item), platform.id)}
                                className="h-8 text-xs"
                              >
                                <div className={`w-2 h-2 rounded-full ${platform.color} mr-2`} />
                                Search on {platform.name}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : query ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No results found</p>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or selecting a different platform
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default StreamingSearch;