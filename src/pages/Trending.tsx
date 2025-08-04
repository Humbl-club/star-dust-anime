import { useState } from "react";
import { useNavigate } from 'react-router-dom';
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

const Trending = () => {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState<'anime' | 'manga'>('anime');
  const { getDisplayName } = useNamePreference();

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
  const data = contentType === 'anime' ? trendingAnime : trendingManga;

  const handleItemClick = (item: any) => {
    // Determine content type and navigate
    const type = item.anime_details ? 'anime' : 'manga';
    navigate(`/${type}/${item.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg">Loading trending content...</p>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="container mx-auto py-8">
        {/* Content type toggle */}
        <Tabs value={contentType} onValueChange={(v) => setContentType(v as 'anime' | 'manga')}>
          <TabsList className="mb-6">
            <TabsTrigger value="anime">Trending Anime</TabsTrigger>
            <TabsTrigger value="manga">Trending Manga</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
          {data?.map((item) => (
            <div
              key={item.id}
              className="cursor-pointer group"
              onClick={() => handleItemClick(item)}
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={item.image_url || '/placeholder.jpg'}
                  alt={getDisplayName(item)}
                  className="w-full aspect-[3/4] object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 p-4">
                    <p className="text-white font-semibold">{getDisplayName(item)}</p>
                    {item.score && (
                      <p className="text-white/80 text-sm">★ {item.score}</p>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium line-clamp-2">{getDisplayName(item)}</p>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && (!data || data.length === 0) && (
          <Card className="text-center p-12">
            <CardContent className="space-y-4">
              <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Trending Content</h3>
              <p className="text-muted-foreground">
                No trending {contentType} found at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Trending;