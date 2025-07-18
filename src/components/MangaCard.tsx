import { memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { type Manga } from "@/data/animeData";
import { useNavigate } from "react-router-dom";

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
      className="anime-card group hover-scale cursor-pointer touch-friendly"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={manga.image_url} 
            alt={displayName}
            loading="lazy"
            className="w-full h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Score Badge */}
          {manga.score && (
            <Badge className="absolute top-2 right-2 glass-card border border-primary/20 glow-primary">
              <Star className="w-3 h-3 mr-1" />
              {manga.score}
            </Badge>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-gradient-primary transition-colors">
            {displayName}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{manga.type}</span>
            {manga.status && (
              <>
                <span>•</span>
                <span className={
                  manga.status === 'Publishing' ? 'text-green-400' :
                  manga.status === 'Finished' ? 'text-blue-400' :
                  'text-yellow-400'
                }>
                  {manga.status}
                </span>
              </>
            )}
            {manga.chapters && (
              <>
                <span>•</span>
                <span>{manga.chapters} ch</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});