import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, ChevronLeft, ChevronRight, Star, Info, TrendingUp } from 'lucide-react';
import { useSmartSimilarContent } from '@/hooks/useSmartSimilarContent';
import { useNamePreference } from '@/hooks/useNamePreference';
import { cn } from '@/lib/utils';

interface SimilarTitlesProps {
  titleId: string;
  contentType: 'anime' | 'manga';
  currentTitle: string;
}

interface SimilarContentResult {
  id: string;
  title: string;
  title_english?: string;
  title_japanese?: string;
  image_url: string;
  score: number;
  anilist_id: number;
  match_reason: string;
  confidence_score: number;
  relation_type?: string;
  genres?: any[];
  studios?: any[];
  authors?: any[];
}

const RELATION_TYPE_MAP: { [key: string]: { label: string; color: string } } = {
  'SEQUEL': { label: 'Sequel', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  'PREQUEL': { label: 'Prequel', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  'ALTERNATIVE': { label: 'Alternative', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  'SIDE_STORY': { label: 'Side Story', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  'PARENT': { label: 'Parent Story', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  'ADAPTATION': { label: 'Adaptation', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' }
};

// Loading skeleton component
const SimilarTitleSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="aspect-[3/4] w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

// Confidence score badge component
const ConfidenceBadge = ({ score }: { score: number }) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (score >= 60) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  return (
    <Badge variant="outline" className={cn("text-xs", getConfidenceColor(score))}>
      {score}% match
    </Badge>
  );
};

// Lazy loading image component with blur effect
const LazyImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
    };
    img.src = src;
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {!imageLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/80 to-muted" />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />
      )}
    </div>
  );
};

export const SimilarTitles = ({ titleId, contentType, currentTitle }: SimilarTitlesProps) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { getDisplayName } = useNamePreference();

  const {
    results: similarTitles,
    loading,
    error,
    refreshContent,
    hasRecommendations,
    hasRelations,
    totalResults,
    cached
  } = useSmartSimilarContent({ 
    titleId, 
    contentType, 
    limit: 12,
    autoLoad: true
  });

  // Update scroll button states
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [similarTitles]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleTitleClick = (item: SimilarContentResult) => {
    navigate(`/${contentType}/${item.id}`);
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Similar {contentType === 'anime' ? 'Anime' : 'Manga'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SimilarTitleSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6 text-center text-muted-foreground">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unable to load similar content: {error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshContent}
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!similarTitles.length) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Similar {contentType === 'anime' ? 'Anime' : 'Manga'}
              <Badge variant="outline" className="ml-2">
                {totalResults} found
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {cached && (
                <Badge variant="outline" className="text-xs">
                  Cached
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshContent}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
          {(hasRecommendations || hasRelations) && (
            <p className="text-sm text-muted-foreground">
              {hasRecommendations && "Including AniList recommendations"}
              {hasRecommendations && hasRelations && " • "}
              {hasRelations && "Related titles found"}
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="relative">
            {/* Scroll buttons */}
            {canScrollLeft && (
              <Button
                variant="outline"
                size="sm"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                onClick={() => scroll('left')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="outline"
                size="sm"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                onClick={() => scroll('right')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            
            {/* Scrollable container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {similarTitles.map((item, index) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex-shrink-0 cursor-pointer group animate-fade-in hover:scale-[1.02] transition-all duration-200"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => handleTitleClick(item)}
                    >
                      <div className="w-32 space-y-2">
                        {/* Image with lazy loading */}
                        <div className="relative">
                          <LazyImage
                            src={item.image_url}
                            alt={getDisplayName(item)}
                            className="aspect-[3/4] rounded-lg group-hover:shadow-lg transition-shadow"
                          />
                          
                          {/* Relation type badge */}
                          {item.relation_type && RELATION_TYPE_MAP[item.relation_type] && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "absolute top-2 left-2 text-xs",
                                RELATION_TYPE_MAP[item.relation_type].color
                              )}
                            >
                              {RELATION_TYPE_MAP[item.relation_type].label}
                            </Badge>
                          )}
                          
                          {/* Score badge */}
                          {item.score > 0 && (
                            <Badge 
                              variant="outline" 
                              className="absolute top-2 right-2 text-xs bg-black/50 text-white border-white/20"
                            >
                              <Star className="w-3 h-3 mr-1" />
                              {item.score.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Title and info */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {getDisplayName(item)}
                          </p>
                          <ConfidenceBadge score={item.confidence_score} />
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{getDisplayName(item)}</p>
                      <p className="text-xs text-muted-foreground">
                        <Info className="w-3 h-3 inline mr-1" />
                        {item.match_reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Confidence: {item.confidence_score}%
                      </p>
                      {item.score > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Score: {item.score.toFixed(1)}/10
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};