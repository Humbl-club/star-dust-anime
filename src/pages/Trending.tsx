import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navigation } from "@/components/Navigation";
import { NameToggle } from "@/components/NameToggle";
import { useNamePreference } from "@/hooks/useNamePreference";
import { useStats } from "@/hooks/useStats";
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
import { useSimpleNewApiData } from "@/hooks/useSimpleNewApiData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type Anime, type Manga } from "@/data/animeData";

const TrendingAnimeCard = ({ anime, rank }: { anime: Anime; rank: number }) => (
  <div className="glass-card border border-glass-border hover:border-primary/30 transition-all duration-300 group cursor-pointer spring-bounce">
    <div className="p-4">
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          <img 
            src={anime.image_url} 
            alt={anime.title}
            className="w-16 h-20 object-cover rounded-lg"
          />
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground glow-primary">
            {rank}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-smooth">
            {anime.title}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Badge variant="secondary" className="text-xs glass-card border-0">
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
              <Badge key={genre} variant="outline" className="text-xs glass-input border-glass-border">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TrendingMangaCard = ({ manga, rank }: { manga: Manga; rank: number }) => (
  <div className="glass-card border border-glass-border hover:border-primary/30 transition-all duration-300 group cursor-pointer spring-bounce">
    <div className="p-4">
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          <img 
            src={manga.image_url} 
            alt={manga.title}
            className="w-16 h-20 object-cover rounded-lg"
          />
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground glow-primary">
            {rank}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-smooth">
            {manga.title}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Badge variant="secondary" className="text-xs glass-card border-0">
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
              <Badge key={genre} variant="outline" className="text-xs glass-input border-glass-border">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Trending = () => {
  const [activeTab, setActiveTab] = useState("anime");
  const { toast } = useToast();
  const { stats, formatCount } = useStats();

  // Get real anime data from API
  const { data: animeData, loading: animeLoading, syncFromExternal: syncAnime } = useSimpleNewApiData({ 
    contentType: 'anime',
    limit: 50,
    sort_by: 'score',
    order: 'desc'
  });

  // Get real manga data from API  
  const { data: mangaData, loading: mangaLoading, syncFromExternal: syncManga } = useSimpleNewApiData({ 
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

  // Helper functions for AniList-focused trending
  const calculateAverageScore = (malScore: number | null, anilistScore: number | null): number => {
    const scores = [malScore, anilistScore].filter(score => score !== null && score > 0);
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score!, 0) / scores.length;
  };

  const calculateAniListTrendingScore = (item: any): number => {
    let score = 0;
    
    // Prioritize AniList data for trending calculation
    if (item.anilist_score) score += item.anilist_score * 0.3;
    if (item.popularity) score += Math.log(item.popularity) * 0.4; // AniList popularity is key
    if (item.favorites) score += Math.log(item.favorites) * 0.2;
    
    // Timeline constraints for "hot right now"
    const isCurrentlyAiring = item.status === 'Currently Airing' || item.status === 'Ongoing';
    if (isCurrentlyAiring) score *= 1.8; // Strong boost for currently airing
    
    // Recent activity boost (within last 6 months)
    const releaseDate = new Date(item.aired_from || item.published_from || 0);
    const monthsAgo = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 6) score *= (1 + (6 - monthsAgo) / 12);
    
    return score;
  };

  // AniList-focused trending with timeline constraints
  const trendingAnime = [...animeData]
    .map(anime => ({
      ...anime,
      averageScore: calculateAverageScore(anime.score, anime.anilist_score),
      trendingScore: calculateAniListTrendingScore(anime)
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 10);
    
  const trendingManga = [...mangaData]
    .map(manga => ({
      ...manga,
      averageScore: calculateAverageScore(manga.score, null), // Manga doesn't have anilist_score yet
      trendingScore: calculateAniListTrendingScore(manga)
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 10);

  const topAnime = animeData[0]; // Highest ranked anime
  const topManga = mangaData[0]; // Highest ranked manga

  const { showEnglish, setShowEnglish } = useNamePreference();

  return (
    <div className="min-h-screen bg-gradient-hero relative">
      <NameToggle showEnglish={showEnglish} onToggle={setShowEnglish} />
      <Navigation />
      
      {/* Header */}
      <div className="relative glass-card border-0 rounded-none bg-gradient-primary/20 backdrop-blur-xl text-foreground py-16 shadow-glow-primary/10">
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
        {/* Auto-Sync Status */}
        {animeData.length === 0 && (
          <div className="glass-card mb-8 p-6 border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-primary">Database Auto-Sync Active</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Comprehensive anime & manga database is automatically syncing in the background
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary glow-primary" />
                <span className="text-sm text-primary font-medium">Syncing...</span>
              </div>
            </div>
          </div>
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
          <div className="glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
            <div className="p-6 relative">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400 glow-accent" />
                <Badge variant="secondary" className="glass-card border-0">
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
            </div>
          </div>

          {/* Top Manga Spotlight */}
          <div className="glass-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-transparent" />
            <div className="p-6 relative">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400 glow-accent" />
                <Badge variant="secondary" className="glass-card border-0">
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
            </div>
          </div>
        </div>

        {/* Trending Lists */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="glass-nav border border-glass-border rounded-xl p-2 max-w-md mx-auto mb-8 shadow-glow-primary/20">
            <div className="grid w-full grid-cols-2 gap-2">
              <Button
                variant={activeTab === "anime" ? "default" : "ghost"}
                onClick={() => setActiveTab("anime")}
                className="flex items-center gap-2 transition-smooth glass-button rounded-lg"
              >
                <Play className="w-4 h-4" />
                Trending Anime
              </Button>
              <Button
                variant={activeTab === "manga" ? "default" : "ghost"}
                onClick={() => setActiveTab("manga")}
                className="flex items-center gap-2 transition-smooth glass-button rounded-lg"
              >
                <BookOpen className="w-4 h-4" />
                Trending Manga
              </Button>
            </div>
          </div>

          {activeTab === "anime" && (
            <div className="glass-card border border-glass-border shadow-glow-primary/10">
              <div className="p-6 border-b border-glass-border bg-gradient-primary/10">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gradient-primary">
                  <TrendingUp className="w-5 h-5 text-primary glow-primary" />
                  Top 10 Trending Anime
                </h2>
              </div>
              <div className="p-6 bg-gradient-subtle">
                <div className="space-y-4">
                  {trendingAnime.map((anime, index) => (
                    <TrendingAnimeCard 
                      key={anime.id} 
                      anime={anime} 
                      rank={index + 1} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "manga" && (
            <div className="glass-card border border-glass-border shadow-glow-primary/10">
              <div className="p-6 border-b border-glass-border bg-gradient-primary/10">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gradient-primary">
                  <TrendingUp className="w-5 h-5 text-primary glow-primary" />
                  Top 10 Trending Manga
                </h2>
              </div>
              <div className="p-6 bg-gradient-subtle">
                <div className="space-y-4">
                  {trendingManga.map((manga, index) => (
                    <TrendingMangaCard 
                      key={manga.id} 
                      manga={manga} 
                      rank={index + 1} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="glass-card border border-glass-border text-center p-6 hover-scale shadow-glow-primary/10">
            <div className="text-2xl font-bold text-primary mb-2 glow-primary">{formatCount(stats.animeCount)}</div>
            <div className="text-sm text-muted-foreground">Anime Titles</div>
          </div>
          
          <div className="glass-card border border-glass-border text-center p-6 hover-scale shadow-glow-accent/10">
            <div className="text-2xl font-bold text-secondary mb-2">{formatCount(stats.mangaCount)}</div>
            <div className="text-sm text-muted-foreground">Manga Titles</div>
          </div>
          
          <div className="glass-card border border-glass-border text-center p-6 hover-scale shadow-glow-primary/10">
            <div className="text-2xl font-bold text-accent mb-2">{formatCount(stats.userCount)}</div>
            <div className="text-sm text-muted-foreground">Community Members</div>
          </div>
          
          <div className="glass-card border border-glass-border text-center p-6 hover-scale shadow-glow-primary/10">
            <div className="text-2xl font-bold text-primary mb-2 glow-primary">2025</div>
            <div className="text-sm text-muted-foreground">Latest Season</div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Trending;