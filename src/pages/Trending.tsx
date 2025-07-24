import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";
import { useSimpleNewApiData } from "@/hooks/useSimpleNewApiData";
import { useNamePreference } from "@/hooks/useNamePreference";
import { useStats } from "@/hooks/useStats";
import { 
  TrendingUp, 
  Star, 
  Play, 
  BookOpen,
  Clock,
  Users,
  Trophy,
  Flame,
  Loader2
} from "lucide-react";

const TrendingCard = ({ item, rank, contentType }: { item: any; rank: number; contentType: 'anime' | 'manga' }) => {
  const { getDisplayName } = useNamePreference();
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Ranking Badge */}
          <div className="relative flex-shrink-0">
            <img 
              src={item.image_url} 
              alt={getDisplayName(item)}
              className="w-16 h-20 object-cover rounded-lg"
            />
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
              #{rank}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-2 line-clamp-1 group-hover:text-primary transition-colors">
              {getDisplayName(item)}
            </h3>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <Badge variant="secondary" className="text-xs">
                {contentType === 'anime' ? <Play className="w-3 h-3 mr-1" /> : <BookOpen className="w-3 h-3 mr-1" />}
                {item.type}
              </Badge>
              {item.score && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <span>{item.score}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-3 h-3" />
                <span className="font-medium">Trending</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {item.synopsis}
            </p>
            
            <div className="flex flex-wrap gap-1">
              {item.genres?.slice(0, 2).map((genre: any) => (
                <Badge key={genre.name || genre} variant="outline" className="text-xs">
                  {genre.name || genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Trending = () => {
  const [activeTab, setActiveTab] = useState<'anime' | 'manga'>('anime');
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month'>('week');
  const { stats, formatCount } = useStats();

  // Use the new optimized hook for trending anime
  const { data: trendingAnime, loading: animeLoading } = useSimpleNewApiData({
    contentType: 'anime',
    limit: 20,
    sort_by: 'popularity',
    order: 'desc'
  });

  // Use the new optimized hook for trending manga
  const { data: trendingManga, loading: mangaLoading } = useSimpleNewApiData({
    contentType: 'manga', 
    limit: 20,
    sort_by: 'popularity',
    order: 'desc'
  });

  const isLoading = animeLoading || mangaLoading;
  const currentData = activeTab === 'anime' ? trendingAnime : trendingManga;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      
      {/* Header */}
      <div className="relative py-20 mb-8">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="relative container mx-auto px-4">
          <Card className="border-primary/30 bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-lg shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <CardTitle className="text-3xl md:text-5xl lg:text-6xl font-bold">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Trending</span>{" "}
                <span className="text-gradient-primary">Now</span>
              </CardTitle>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-4">
                Discover what's hot in the anime and manga community right now.
              </p>
            </CardHeader>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'anime' | 'manga')} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-2 md:w-auto">
              <TabsTrigger value="anime" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Anime
              </TabsTrigger>
              <TabsTrigger value="manga" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Manga
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={timePeriod} onValueChange={(value: any) => setTimePeriod(value)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-dropdown">
              <SelectItem value="today">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Today
                </div>
              </SelectItem>
              <SelectItem value="week">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  This Week
                </div>
              </SelectItem>
              <SelectItem value="month">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  This Month
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading trending {activeTab}...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && currentData && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                Top 20 Trending {activeTab === 'anime' ? 'Anime' : 'Manga'}
                <Badge variant="secondary" className="ml-2">
                  {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
                </Badge>
              </h2>
            </div>

            <div className="grid gap-4">
              {currentData.slice(0, 20).map((item: any, index: number) => (
                <TrendingCard
                  key={item.id}
                  item={item}
                  rank={index + 1}
                  contentType={activeTab}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!currentData || currentData.length === 0) && (
          <Card className="text-center p-12">
            <CardContent className="space-y-4">
              <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Trending Content</h3>
              <p className="text-muted-foreground">
                No trending {activeTab} found for this time period.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center p-6">
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-gradient-primary">{formatCount(stats.animeCount)}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Play className="w-3 h-3" />
                Total Anime
              </div>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-gradient-secondary">{formatCount(stats.mangaCount)}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3" />
                Total Manga
              </div>
            </CardContent>
          </Card>
          <Card className="text-center p-6">
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-gradient-primary">{formatCount(stats.userCount)}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="w-3 h-3" />
                Active Users
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Trending;