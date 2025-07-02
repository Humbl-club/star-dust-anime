import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  Star, 
  Play, 
  BookOpen,
  Clock,
  Users,
  Heart,
  Trophy,
  Download,
  Database,
  Loader2
} from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type Anime, type Manga } from "@/data/animeData";

const TrendingAnimeCard = ({ anime, rank }: { anime: Anime; rank: number }) => (
  <Card className="group hover:shadow-glow-card transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm">
    <CardContent className="p-4">
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          <img 
            src={anime.image_url} 
            alt={anime.title}
            className="w-16 h-20 object-cover rounded-lg"
          />
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
            {rank}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {anime.title}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Badge variant="secondary" className="text-xs">
              <Play className="w-3 h-3 mr-1" />
              {anime.type}
            </Badge>
            {anime.score && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400" />
                <span>{anime.score}</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {anime.synopsis}
          </p>
          
          <div className="flex flex-wrap gap-1">
            {anime.genres.slice(0, 2).map(genre => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const TrendingMangaCard = ({ manga, rank }: { manga: Manga; rank: number }) => (
  <Card className="group hover:shadow-glow-card transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm">
    <CardContent className="p-4">
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          <img 
            src={manga.image_url} 
            alt={manga.title}
            className="w-16 h-20 object-cover rounded-lg"
          />
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
            {rank}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {manga.title}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Badge variant="secondary" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              {manga.type}
            </Badge>
            {manga.score && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400" />
                <span>{manga.score}</span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {manga.synopsis}
          </p>
          
          <div className="flex flex-wrap gap-1">
            {manga.genres.slice(0, 2).map(genre => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const Trending = () => {
  const [activeTab, setActiveTab] = useState("anime");
  const { toast } = useToast();

  // Get real anime data from API
  const { data: animeData, loading: animeLoading, syncFromExternal: syncAnime } = useApiData<Anime>({ 
    contentType: 'anime',
    limit: 50,
    sort_by: 'score',
    order: 'desc'
  });

  // Get real manga data from API  
  const { data: mangaData, loading: mangaLoading, syncFromExternal: syncManga } = useApiData<Manga>({ 
    contentType: 'manga',
    limit: 50,
    sort_by: 'score',
    order: 'desc'
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const handleBulkSync = async (type: 'anime' | 'manga' | 'both' = 'both') => {
    setIsSyncing(true);
    try {
      const response = await fetch('https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/bulk-sync-anime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentType: type })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Database populated!",
          description: `Successfully added ${result.anime_processed || 0} anime and ${result.manga_processed || 0} manga`,
        });
        // Refresh the data
        window.location.reload();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to populate database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAniListSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-anilist-data', {
        body: { batchSize: 50, offset: 0 }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Function invocation failed');
      }

      toast({
        title: "AniList sync completed!",
        description: `Processed: ${data.processed}, Remaining: ${data.remaining}`,
      });

      if (data.remaining > 0) {
        toast({
          title: "More data available",
          description: `${data.remaining} anime still need AniList data. Run sync again to continue.`,
        });
      }
    } catch (error: any) {
      console.error('AniList sync error:', error);
      toast({
        title: "AniList sync failed",
        description: error.message || "Failed to sync AniList data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Sort by score for trending
  const trendingAnime = [...animeData]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10);
    
  const trendingManga = [...mangaData]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10);

  const topAnime = animeData[0]; // Highest ranked anime
  const topManga = mangaData[0]; // Highest ranked manga

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Trending Now
              </h1>
            </div>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Discover what's hot in the anime and manga community right now.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Data Sync Section */}
        {animeData.length === 0 && (
          <Alert className="mb-8 border-primary/20 bg-primary/5">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium mb-1">Comprehensive Database Population</p>
                  <p className="text-sm text-muted-foreground">
                    Get the complete MyAnimeList database: ~2000 anime + ~1500 manga
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleBulkSync('both')} 
                    disabled={isSyncing}
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading Everything... (~10 min)
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Get All Content
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => handleBulkSync('anime')} 
                    disabled={isSyncing}
                    variant="outline"
                    size="sm"
                  >
                    Anime Only
                  </Button>
                  <Button 
                    onClick={() => handleBulkSync('manga')} 
                    disabled={isSyncing}
                    variant="outline"
                    size="sm"
                  >
                     Manga Only
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* AniList Enhancement Section */}
        {animeData.length > 0 && (
          <Alert className="mb-8 border-blue-500/20 bg-blue-500/5">
            <Star className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium mb-1">AniList Enhancement</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade your database with high-quality images, characters, and streaming links from AniList
                  </p>
                </div>
                <Button 
                  onClick={handleAniListSync} 
                  disabled={isSyncing}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing AniList...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Sync AniList Data
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {(animeLoading || mangaLoading) && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading trending content...</p>
            </div>
          </div>
        )}

        {/* Show content only if we have data */}
        {animeData.length > 0 && (
          <>
        {/* Featured Spotlight */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Top Anime Spotlight */}
          <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <Badge variant="secondary">
                  <Play className="w-3 h-3 mr-1" />
                  #1 Anime
                </Badge>
              </div>
              
            {topAnime && (
              <div className="flex gap-4">
                <img 
                  src={topAnime.image_url} 
                  alt={topAnime.title}
                  className="w-24 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{topAnime.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{topAnime.score}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{topAnime.members?.toLocaleString()} members</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {topAnime.synopsis}
                  </p>
                </div>
              </div>
            )}
            </CardContent>
          </Card>

          {/* Top Manga Spotlight */}
          <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <Badge variant="secondary">
                  <BookOpen className="w-3 h-3 mr-1" />
                  #1 Manga
                </Badge>
              </div>
              
              {topManga && (
                <div className="flex gap-4">
                  <img 
                    src={topManga.image_url} 
                    alt={topManga.title}
                    className="w-24 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{topManga.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>{topManga.score}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{topManga.members?.toLocaleString()} members</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {topManga.synopsis}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trending Lists */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="anime" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Trending Anime
            </TabsTrigger>
            <TabsTrigger value="manga" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Trending Manga
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anime">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top 10 Trending Anime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendingAnime.map((anime, index) => (
                    <TrendingAnimeCard 
                      key={anime.id} 
                      anime={anime} 
                      rank={index + 1} 
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manga">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top 10 Trending Manga
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendingManga.map((manga, index) => (
                    <TrendingMangaCard 
                      key={manga.id} 
                      manga={manga} 
                      rank={index + 1} 
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <Card className="text-center p-6 border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-primary mb-2">{animeData.length}</div>
            <div className="text-sm text-muted-foreground">Anime Titles</div>
          </Card>
          
          <Card className="text-center p-6 border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-primary mb-2">{mangaData.length}</div>
            <div className="text-sm text-muted-foreground">Manga Titles</div>
          </Card>
          
          <Card className="text-center p-6 border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-primary mb-2">9.4</div>
            <div className="text-sm text-muted-foreground">Highest Rated</div>
          </Card>
          
          <Card className="text-center p-6 border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-primary mb-2">2025</div>
            <div className="text-sm text-muted-foreground">Latest Season</div>
          </Card>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Trending;