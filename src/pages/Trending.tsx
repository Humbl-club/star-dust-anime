import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Star } from "lucide-react";
import { useSimpleNewApiData } from "@/hooks/useSimpleNewApiData";

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
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Trending Now
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Discover the most popular {contentType === 'anime' ? 'anime' : 'manga'} that everyone's talking about
        </p>
      </div>

      {/* Content type toggle */}
      <div className="flex justify-center">
        <Tabs value={contentType} onValueChange={(v) => setContentType(v as 'anime' | 'manga')} className="w-auto">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="anime" className="text-base font-medium">
              Trending Anime
            </TabsTrigger>
            <TabsTrigger value="manga" className="text-base font-medium">
              Trending Manga
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Grid */}
      {loading ? (
        renderSkeleton()
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {data?.map((item, index) => (
            <Card
              key={item.id}
              className="group cursor-pointer border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-lg">
                  {/* Rank Badge */}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-3 left-3 z-10 bg-primary/90 text-primary-foreground border-0 font-bold"
                  >
                    #{index + 1}
                  </Badge>
                  
                  <img
                    src={item.image_url || '/placeholder.jpg'}
                    alt={item.title}
                    className="w-full aspect-[3/4] object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                      <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                        {item.title}
                      </h3>
                      {item.score && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-white/90 text-xs font-medium">
                            {item.score}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Title below image */}
                <div className="p-3 space-y-1">
                  <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
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
      
      {/* Empty State */}
      {!loading && (!data || data.length === 0) && (
        <div className="text-center py-12 space-y-4">
          <TrendingUp className="h-16 w-16 text-muted-foreground/50 mx-auto" />
          <h3 className="text-xl font-semibold text-muted-foreground">
            No trending {contentType} found
          </h3>
          <p className="text-muted-foreground">
            Check back later for the latest trending content
          </p>
        </div>
      )}
    </div>
  );
};

export default Trending;