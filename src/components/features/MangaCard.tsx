import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { Star, BookOpen, Calendar } from "lucide-react";
import { AddToListButton } from "./AddToListButton";
import { type Manga } from "@/data/animeData";

interface MangaCardProps {
  manga: Manga;
  onClick?: () => void;
  getDisplayName?: (manga: Manga) => string;
}

export const MangaCard = memo(({ 
  manga,
  onClick,
  getDisplayName
}: MangaCardProps) => {
  const navigate = useNavigate();

  const displayName = getDisplayName ? getDisplayName(manga) : manga.title;

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/manga/${manga.id}`);
    }
  }, [onClick, navigate, manga.id]);

  return (
    <Card 
      className="manga-card group hover-scale cursor-pointer touch-friendly relative h-[400px]"
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
      
      {/* Image Container */}
      <div className="relative h-full overflow-hidden">
        <LazyImage
          src={manga.image_url}
          alt={displayName}
          className="w-full h-full"
          placeholderClassName="bg-gradient-to-br from-accent/20 to-secondary/20"
        />
        
        {/* Status Badge */}
        <Badge 
          className="absolute top-3 right-3 z-20 glass-card border border-accent/20 glow-accent"
          variant="secondary"
        >
          {manga.status}
        </Badge>

        {/* Score Badge */}
        {manga.score && (
          <div className="absolute top-3 left-3 z-20 p-2 glass-card border border-yellow-400/20 rounded-full flex items-center gap-1" style={{boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)'}}>
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-semibold text-foreground">{manga.score}</span>
          </div>
        )}
      </div>
      
      {/* Content Overlay */}
      <CardContent className="absolute bottom-0 left-0 right-0 z-20 p-4">
        <div className="glass-card p-4 border border-border/20 space-y-2">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-gradient-accent transition-all duration-300">
            {displayName}
          </h3>
          
          {/* Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {manga.published_from && (
              <>
                <span>{new Date(manga.published_from).getFullYear()}</span>
                <span>•</span>
              </>
            )}
            <span>{manga.type}</span>
            {manga.chapters && (
              <>
                <span>•</span>
                <span>{manga.chapters} ch</span>
              </>
            )}
          </div>
          
          {/* Add to List Button */}
          <div className="mt-3">
            <AddToListButton 
              item={manga} 
              type="manga" 
              variant="outline" 
              size="sm"
              className="w-full glass-input border-accent/20 hover:border-accent/40 hover:bg-accent/10"
            />
          </div>
        </div>
      </CardContent>
      
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-15" />
    </Card>
  );
});