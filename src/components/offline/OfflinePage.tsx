import React, { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, Home, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { indexedDBManager, AnimeData, MangaData } from '@/lib/storage/indexedDB';
import { useNavigate } from 'react-router-dom';

export const OfflinePage: React.FC = () => {
  const [recentAnime, setRecentAnime] = useState<AnimeData[]>([]);
  const [recentManga, setRecentManga] = useState<MangaData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOfflineData();
  }, []);

  const loadOfflineData = async () => {
    try {
      setLoading(true);
      const [anime, manga] = await Promise.all([
        indexedDBManager.getRecentAnime(10),
        indexedDBManager.getRecentManga(10)
      ]);
      setRecentAnime(anime);
      setRecentManga(manga);
    } catch (error) {
      console.error('Error loading offline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading offline content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <CloudOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-2">You're Offline</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            No internet connection detected. Here's your cached content to browse while offline.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Button onClick={handleRetry} variant="default" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </div>

        {/* Recently Viewed Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Anime */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Recently Viewed Anime
              </CardTitle>
              <CardDescription>
                Anime you've recently viewed (cached offline)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAnime.length > 0 ? (
                <div className="space-y-4">
                  {recentAnime.map((anime) => (
                    <div
                      key={anime.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/anime/${anime.id}`)}
                    >
                      <img
                        src={anime.image_url}
                        alt={anime.title}
                        className="w-12 h-16 object-cover rounded"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{anime.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Score: {anime.score?.toFixed(1) || 'N/A'}
                        </p>
                        {anime.episodes && (
                          <p className="text-xs text-muted-foreground">
                            {anime.episodes} episodes
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p>No cached anime found</p>
                  <p className="text-sm">Browse some anime while online to cache them</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Manga */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Recently Viewed Manga
              </CardTitle>
              <CardDescription>
                Manga you've recently viewed (cached offline)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentManga.length > 0 ? (
                <div className="space-y-4">
                  {recentManga.map((manga) => (
                    <div
                      key={manga.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/manga/${manga.id}`)}
                    >
                      <img
                        src={manga.image_url}
                        alt={manga.title}
                        className="w-12 h-16 object-cover rounded"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{manga.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Score: {manga.score?.toFixed(1) || 'N/A'}
                        </p>
                        {manga.chapters && (
                          <p className="text-xs text-muted-foreground">
                            {manga.chapters} chapters
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p>No cached manga found</p>
                  <p className="text-sm">Browse some manga while online to cache them</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tips for Offline Usage */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Offline Tips</CardTitle>
            <CardDescription>
              Make the most of your offline experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">What works offline:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Browse recently viewed content</li>
                  <li>• View cached anime/manga details</li>
                  <li>• Add items to your list (syncs later)</li>
                  <li>• Update progress (syncs later)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Requires internet:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Search for new content</li>
                  <li>• View trending/popular lists</li>
                  <li>• Sync changes to server</li>
                  <li>• Load new images</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};