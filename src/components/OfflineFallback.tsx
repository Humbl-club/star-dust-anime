import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Star, Calendar, User, BookOpen, Tv } from 'lucide-react';
import { offlineStorage, CachedAnime, CachedManga } from '@/lib/cache/offlineStorage';

interface OfflineFallbackProps {
  type: 'anime' | 'manga';
  onRetry?: () => void;
}

export function OfflineFallback({ type, onRetry }: OfflineFallbackProps) {
  const { id } = useParams<{ id: string }>();
  const [cachedContent, setCachedContent] = useState<CachedAnime | CachedManga | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCachedContent = async () => {
      if (!id) return;

      try {
        const cached = type === 'anime' 
          ? await offlineStorage.getCachedAnime(id)
          : await offlineStorage.getCachedManga(id);
        
        setCachedContent(cached);
      } catch (error) {
        console.error('Failed to load cached content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCachedContent();
  }, [id, type]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cached content...</p>
        </div>
      </div>
    );
  }

  if (!cachedContent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <WifiOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Content Not Available Offline</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This {type} isn't cached for offline viewing. You need an internet connection to view this content.
            </p>
            <div className="space-y-2">
              <Button onClick={onRetry} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="w-full">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Offline Banner */}
        <div className="mb-6">
          <Card className="border-yellow-500/20 bg-yellow-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-300">
                    Viewing Offline Content
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    This is cached data. Some information may be outdated.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                {cachedContent.image_url ? (
                  <img
                    src={cachedContent.image_url}
                    alt={cachedContent.title}
                    className="w-full rounded-lg"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                    {type === 'anime' ? (
                      <Tv className="h-16 w-16 text-muted-foreground" />
                    ) : (
                      <BookOpen className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{cachedContent.title}</h1>
              {cachedContent.title_english && cachedContent.title_english !== cachedContent.title && (
                <p className="text-xl text-muted-foreground mb-2">{cachedContent.title_english}</p>
              )}
              {cachedContent.title_japanese && (
                <p className="text-lg text-muted-foreground">{cachedContent.title_japanese}</p>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {cachedContent.score}/10
              </Badge>
              
              {cachedContent.status && (
                <Badge variant="secondary">{cachedContent.status}</Badge>
              )}
              
              {type === 'anime' && 'episodes' in cachedContent && cachedContent.episodes && (
                <Badge variant="outline">{cachedContent.episodes} episodes</Badge>
              )}
              
              {type === 'manga' && 'chapters' in cachedContent && cachedContent.chapters && (
                <Badge variant="outline">{cachedContent.chapters} chapters</Badge>
              )}
            </div>

            {cachedContent.genres && cachedContent.genres.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {cachedContent.genres.map((genre, index) => (
                    <Badge key={index} variant="outline">{genre}</Badge>
                  ))}
                </div>
              </div>
            )}

            {cachedContent.synopsis && (
              <div>
                <h3 className="font-semibold mb-2">Synopsis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {cachedContent.synopsis}
                </p>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {type === 'anime' && 'aired_from' in cachedContent && cachedContent.aired_from && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Aired: {new Date(cachedContent.aired_from).getFullYear()}
                    {cachedContent.aired_to && ` - ${new Date(cachedContent.aired_to).getFullYear()}`}
                  </span>
                </div>
              )}

              {type === 'manga' && 'published_from' in cachedContent && cachedContent.published_from && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Published: {new Date(cachedContent.published_from).getFullYear()}
                    {cachedContent.published_to && ` - ${new Date(cachedContent.published_to).getFullYear()}`}
                  </span>
                </div>
              )}

              {type === 'anime' && 'studios' in cachedContent && cachedContent.studios && cachedContent.studios.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Studio: {cachedContent.studios.join(', ')}</span>
                </div>
              )}

              {type === 'manga' && 'authors' in cachedContent && cachedContent.authors && cachedContent.authors.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Author: {cachedContent.authors.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Retry Button */}
            <div className="pt-4">
              <Button onClick={onRetry} className="w-full md:w-auto">
                Try to Load Online Version
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}