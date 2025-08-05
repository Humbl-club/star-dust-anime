import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Genre {
  id: string;
  name: string;
  slug: string;
  category: string;
  relevance?: number;
}

interface GenreDisplayProps {
  genres: Genre[];
  variant?: 'default' | 'compact' | 'detailed';
  interactive?: boolean;
  className?: string;
}

const categoryColors: Record<string, string> = {
  theme: 'bg-primary/10 text-primary border-primary/20',
  demographic: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  genre: 'bg-accent/10 text-accent-foreground border-accent/20',
  setting: 'bg-muted/20 text-muted-foreground border-muted/30',
  format: 'bg-card/50 text-card-foreground border-border',
  both: 'bg-primary/10 text-primary border-primary/20',
  anime: 'bg-primary/10 text-primary border-primary/20',
  manga: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
};

export const GenreDisplay: React.FC<GenreDisplayProps> = ({
  genres,
  variant = 'default',
  interactive = true,
  className
}) => {
  const navigate = useNavigate();

  const handleGenreClick = (slug: string) => {
    if (interactive) {
      navigate(`/browse?genre=${slug}`);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {genres.slice(0, 3).map((genre) => (
          <Badge
            key={genre.id}
            variant="outline"
            className={cn(
              'text-xs cursor-pointer transition-all hover:scale-105',
              categoryColors[genre.category] || categoryColors.genre
            )}
            onClick={() => handleGenreClick(genre.slug)}
          >
            {genre.name}
          </Badge>
        ))}
        {genres.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{genres.length - 3}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium text-muted-foreground">Genres</h3>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Badge
            key={genre.id}
            variant="outline"
            className={cn(
              'cursor-pointer transition-all hover:scale-105',
              categoryColors[genre.category] || categoryColors.genre,
              interactive && 'hover:shadow-md'
            )}
            onClick={() => handleGenreClick(genre.slug)}
          >
            <span>{genre.name}</span>
            {variant === 'detailed' && genre.relevance && (
              <span className="ml-1 text-xs opacity-60">
                {Math.round(genre.relevance * 100)}%
              </span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
};