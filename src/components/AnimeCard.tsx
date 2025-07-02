import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Play, BookOpen, Calendar } from "lucide-react";

interface AnimeCardProps {
  id: number;
  title: string;
  image: string;
  rating: number;
  year: number;
  episode_count?: number;
  chapter_count?: number;
  status: string;
  genres: string[];
  type: "anime" | "manga";
  onClick?: () => void;
}

export const AnimeCard = ({ 
  title, 
  image, 
  rating, 
  year, 
  episode_count, 
  chapter_count, 
  status, 
  genres, 
  type,
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
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Floating Status Badge */}
        <Badge 
          className="absolute top-3 right-3 z-20 bg-primary/90 backdrop-blur-sm"
          variant="default"
        >
          {status}
        </Badge>

        {/* Type Icon */}
        <div className="absolute top-3 left-3 z-20 p-2 bg-black/50 backdrop-blur-sm rounded-full">
          {type === "anime" ? (
            <Play className="w-4 h-4 text-primary" />
          ) : (
            <BookOpen className="w-4 h-4 text-accent" />
          )}
        </div>
      </div>
      
      {/* Content Overlay */}
      <CardContent className="absolute bottom-0 left-0 right-0 z-20 p-4 text-white">
        <div className="space-y-2">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-gradient-primary transition-all duration-300">
            {title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{year}</span>
            </div>
            
            {type === "anime" && episode_count && (
              <span>{episode_count} eps</span>
            )}
            
            {type === "manga" && chapter_count && (
              <span>{chapter_count} ch</span>
            )}
          </div>
          
          {/* Genres */}
          <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden">
            {genres.slice(0, 3).map((genre, index) => (
              <Badge 
                key={index}
                variant="secondary" 
                className="text-xs bg-secondary/80 backdrop-blur-sm"
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-15" />
    </Card>
  );
};