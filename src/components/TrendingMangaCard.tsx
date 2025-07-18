import { memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, BookOpen } from "lucide-react";
import { type Manga } from "@/data/animeData";

interface TrendingMangaCardProps {
  manga: Manga;
  rank: number;
  getDisplayName: (manga: Manga) => string;
  onClick?: () => void;
}

export const TrendingMangaCard = memo(({ 
  manga, 
  rank, 
  getDisplayName,
  onClick
}: TrendingMangaCardProps) => {
  const displayName = getDisplayName(manga);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <Card 
      className="anime-card cursor-pointer group h-[300px] hover-scale touch-spring relative overflow-hidden"
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
      
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={manga.image_url} 
          alt={displayName}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      
      {/* Rank Badge */}
      <div className="absolute top-3 left-3 z-20">
        <Badge className="glass-card border border-purple-400/30 bg-purple-400/20 text-purple-300 font-bold text-lg px-3 py-1">
          #{rank}
        </Badge>
      </div>
      
      {/* Score Badge */}
      {manga.score && (
        <div className="absolute top-3 right-3 z-20">
          <Badge className="glass-card border border-green-400/30 bg-green-400/20 text-green-300 font-semibold">
            <Star className="w-3 h-3 mr-1" />
            {manga.score}
          </Badge>
        </div>
      )}
      
      {/* Content */}
      <CardContent className="absolute bottom-0 left-0 right-0 z-20 p-4">
        <div className="space-y-2">
          <h3 className="font-bold text-white text-lg line-clamp-2 group-hover:text-gradient-primary transition-colors">
            {displayName}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-white/80">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>Trending</span>
            {manga.chapters && (
              <>
                <span>•</span>
                <BookOpen className="w-3 h-3" />
                <span>{manga.chapters} ch</span>
              </>
            )}
          </div>
          
          {manga.status && (
            <Badge 
              variant="secondary" 
              className="bg-primary/20 text-primary border-primary/30"
            >
              {manga.status}
            </Badge>
          )}
        </div>
      </CardContent>
      
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-15" />
    </Card>
  );
});