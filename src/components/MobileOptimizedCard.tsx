import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Plus, Check, Star, Share2 } from 'lucide-react';
import { useNativeActions } from '@/hooks/useNativeActions';
import { cn } from '@/lib/utils';

interface MobileOptimizedCardProps {
  title: string;
  imageUrl?: string;
  rating?: number;
  year?: number;
  genres?: string[];
  status?: string;
  isInList?: boolean;
  onAddToList?: () => void;
  onView?: () => void;
  className?: string;
}

export const MobileOptimizedCard = ({
  title,
  imageUrl,
  rating,
  year,
  genres = [],
  status,
  isInList = false,
  onAddToList,
  onView,
  className,
}: MobileOptimizedCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { hapticFeedback, nativeShare } = useNativeActions();

  const handleShare = async () => {
    await hapticFeedback('light');
    await nativeShare({
      title: `Check out ${title}`,
      text: `I found this amazing anime: ${title}`,
      url: window.location.href,
    });
  };

  const handleAddToList = async () => {
    await hapticFeedback('medium');
    onAddToList?.();
  };

  const handleView = async () => {
    await hapticFeedback('light');
    onView?.();
  };

  return (
    <Card className={cn(
      "relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50",
      "touch-manipulation select-none",
      "transition-all duration-200 active:scale-95",
      className
    )}>
      {/* Image Section */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {imageUrl && (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <img
              src={imageUrl}
              alt={title}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-2 left-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 h-8 text-xs"
              onClick={handleView}
            >
              <Play className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant={isInList ? "default" : "outline"}
              className="h-8 px-2"
              onClick={handleAddToList}
            >
              {isInList ? (
                <Check className="w-3 h-3" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        {status && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 text-xs px-2 py-0.5"
          >
            {status}
          </Badge>
        )}

        {/* Share Button */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4 text-white" />
        </Button>
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-2">
        <h3 
          className="font-medium text-sm leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors"
          onClick={handleView}
        >
          {title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {year && <span>{year}</span>}
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Genres */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.slice(0, 2).map((genre) => (
              <Badge
                key={genre}
                variant="outline"
                className="text-xs px-1.5 py-0.5 h-auto"
              >
                {genre}
              </Badge>
            ))}
            {genres.length > 2 && (
              <Badge
                variant="outline"
                className="text-xs px-1.5 py-0.5 h-auto text-muted-foreground"
              >
                +{genres.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};