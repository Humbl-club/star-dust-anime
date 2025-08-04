import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Star } from "lucide-react";
import { useSimpleNewApiData } from "@/hooks/useSimpleNewApiData";
import { LegalFooter } from "@/components/LegalFooter";

const Trending = () => {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState<'anime' | 'manga'>('anime');

  // Fetch data based on content type
  const { data: animeData, loading: animeLoading } = useSimpleNewApiData({
    contentType: 'anime',
    limit: 24,
    sort_by: 'popularity',
    order: 'desc'
  });

  const { data: mangaData, loading: mangaLoading } = useSimpleNewApiData({
    contentType: 'manga',
    limit: 24,
    sort_by: 'popularity',
    order: 'desc'
  });

  const data = contentType === 'anime' ? animeData : mangaData;
  const loading = contentType === 'anime' ? animeLoading : mangaLoading;

  const handleItemClick = (item: any) => {
    // Determine content type and navigate
    const type = item.anime_details ? 'anime' : 'manga';
    navigate(`/${type}/${item.id}`);
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {Array.from({ length: 24 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-[3/4] rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Trending {contentType === 'anime' ? 'Anime' : 'Manga'} | Discover Popular Content</title>
        <meta name="description" content={`Discover the most trending ${contentType} that everyone's talking about. Updated daily with the latest popularity rankings.`} />
      </Helmet>
      
      <Navigation />
      
      <main className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 space-y-8">
          {/* Hero Header Section */}
          <div className="text-center space-y-6 py-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 glass-card border border-primary/20 rounded-full">
              <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Live Updates</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Trending Now
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                Discover the most popular {contentType === 'anime' ? 'anime' : 'manga'} that everyone's talking about
              </p>
            </div>
          </div>

          {/* Content Type Toggle */}
          <div className="flex justify-center">
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as 'anime' | 'manga')} className="w-auto">
              <TabsList className="glass-card border border-primary/20 grid w-full grid-cols-2 h-14 p-1">
                <TabsTrigger 
                  value="anime" 
                  className="text-base font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Anime
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="manga" 
                  className="text-base font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Manga
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Stats Banner */}
          {!loading && data && data.length > 0 && (
            <div className="flex justify-center">
              <div className="glass-card border border-primary/20 px-6 py-3 rounded-full">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-primary rounded-full animate-pulse" />
                    <span className="text-muted-foreground">
                      Showing top {data.length} trending {contentType}
                    </span>
                  </div>
                  <div className="w-1 h-4 bg-border" />
                  <span className="text-muted-foreground">Updated hourly</span>
                </div>
              </div>
            </div>
          )}

          {/* Content Grid */}
          {loading ? (
            renderSkeleton()
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {data?.map((item, index) => (
                <Card
                  key={item.id}
                  className="group cursor-pointer border-0 glass-card hover:shadow-glow-primary transition-all duration-500 hover:scale-[1.02] overflow-hidden"
                  onClick={() => handleItemClick(item)}
                >
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      {/* Trending Rank Badge */}
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 left-2 z-10 bg-gradient-primary text-primary-foreground border-0 font-bold text-xs shadow-lg"
                      >
                        #{index + 1}
                      </Badge>
                      
                      <img
                        src={item.image_url || '/placeholder.jpg'}
                        alt={item.title}
                        className="w-full aspect-[3/4] object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      
                      {/* Enhanced Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-elegant opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            {item.score && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-white/90 text-xs font-medium">
                                  {item.score}
                                </span>
                              </div>
                            )}
                            <Badge 
                              variant="outline" 
                              className="text-xs border-white/30 text-white bg-white/10 backdrop-blur-sm"
                            >
                              Trending
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Title Section */}
                    <div className="p-3 space-y-2">
                      <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        {item.score && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground font-medium">
                              {item.score}
                            </span>
                          </div>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {contentType === 'anime' ? 'Anime' : 'Manga'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Enhanced Empty State */}
          {!loading && (!data || data.length === 0) && (
            <div className="text-center py-16 space-y-6">
              <div className="w-24 h-24 mx-auto glass-card border border-primary/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-muted-foreground">
                  No trending {contentType} found
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Check back later for the latest trending content. Our rankings update hourly based on popularity and community engagement.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <LegalFooter />
    </>
  );
};

export default Trending;