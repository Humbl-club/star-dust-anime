import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Play, BookOpen, Calendar } from "lucide-react";
import { AddToListButton } from "@/components/AddToListButton";
import { type Anime } from "@/data/animeData";

interface AnimeCardProps {
  anime: Anime;
  onClick?: () => void;
}

export const AnimeCard = ({ 
  anime,
  onClick 
}: AnimeCardProps) => {
  return (
    <Card 
      className="anime-card cursor-pointer group relative h-[400px] overflow-hidden"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
      
      {/* Image Container */}
      <div className="relative h-full overflow-hidden">
        <img 
          src={anime.image_url} 
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Floating Status Badge */}
        <Badge 
          className="absolute top-3 right-3 z-20 bg-primary/90 backdrop-blur-sm"
          variant="default"
        >
          {anime.status}
        </Badge>

        {/* Score Badge */}
        {anime.score && (
          <div className="absolute top-3 left-3 z-20 p-2 bg-black/50 backdrop-blur-sm rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-semibold text-white">{anime.score}</span>
          </div>
        )}
      </div>
      
      {/* Content Overlay */}
      <CardContent className="absolute bottom-0 left-0 right-0 z-20 p-4 text-white">
        <div className="space-y-2">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-gradient-primary transition-all duration-300">
            {anime.title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{anime.year}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Play className="w-4 h-4" />
              <span>{anime.type}</span>
            </div>
            
            {anime.episodes && (
              <span>{anime.episodes} eps</span>
            )}
          </div>
          
          {/* Genres */}
          <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden">
            {anime.genres.slice(0, 3).map((genre, index) => (
              <Badge 
                key={index}
                variant="secondary" 
                className="text-xs bg-secondary/80 backdrop-blur-sm"
              >
                {genre}
              </Badge>
            ))}
          </div>
          
          {/* Add to List Button */}
          <div className="mt-3">
            <AddToListButton 
              item={anime} 
              type="anime" 
              variant="outline" 
              size="sm"
              className="w-full bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            />
          </div>
        </div>
      </CardContent>
      
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-15" />
    </Card>
  );
};