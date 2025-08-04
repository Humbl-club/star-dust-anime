import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Eye, Calendar, Clock, Video, Users, MessageSquare, RefreshCw } from "lucide-react";
import { useSmartTrailerSearch } from "@/hooks/useSmartTrailerSearch";
import { cn } from "@/lib/utils";

interface TrailerResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: string;
  duration?: string;
  type: 'official' | 'review' | 'explanation';
  youtuber?: string;
}

interface SmartTrailerSectionProps {
  animeTitle: string;
  className?: string;
}

const CACHE_EXPIRY_DAYS = 7;
const CACHE_KEY_PREFIX = 'smart_trailer_cache_';

// Format view count for display
const formatViewCount = (viewCount?: string): string => {
  if (!viewCount) return '';
  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
};

// Format duration from ISO 8601 to readable format
const formatDuration = (duration?: string): string => {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Cache management
const getCachedResults = (animeTitle: string): TrailerResult[] | null => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${animeTitle.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const expiryTime = timestamp + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    if (now > expiryTime) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading trailer cache:', error);
    return null;
  }
};

const setCachedResults = (animeTitle: string, results: TrailerResult[]): void => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${animeTitle.toLowerCase()}`;
    const cacheData = {
      data: results,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing trailer cache:', error);
  }
};

// Loading skeleton component
const TrailerSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-32 w-48 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  </div>
);

const VideoCard = ({ video, index }: { video: TrailerResult; index: number }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'official':
        return <Play className="w-4 h-4" />;
      case 'review':
        return <MessageSquare className="w-4 h-4" />;
      case 'analysis':
        return <Users className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'official':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'review':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'analysis':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div 
      className="group cursor-pointer animate-fade-in hover:scale-[1.02] transition-all duration-200"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="relative flex-shrink-0">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-32 h-20 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-white" />
              </div>
              {video.duration && (
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                  {formatDuration(video.duration)}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {video.title}
                </h4>
                <Badge 
                  variant="outline" 
                  className={cn("flex items-center gap-1 text-xs", getTypeColor(video.type))}
                >
                  {getTypeIcon(video.type)}
                  {video.type}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {video.channelTitle}
                {video.youtuber && ` • ${video.youtuber}`}
              </p>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {video.viewCount && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatViewCount(video.viewCount)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(video.publishedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const SmartTrailerSection: React.FC<SmartTrailerSectionProps> = ({ 
  animeTitle, 
  className 
}) => {
  const [cachedResults, setCachedResults] = useState<TrailerResult[] | null>(null);
  
  // Check cache first
  useEffect(() => {
    const cached = getCachedResults(animeTitle);
    if (cached && cached.length > 0) {
      setCachedResults(cached);
    }
  }, [animeTitle]);
  
  const {
    trailers,
    loading,
    error,
    searchResult,
    refreshSearch,
    getTrailersByType,
    getBestTrailer,
    hasOfficialTrailer,
    hasReviews,
    hasExplanations,
    totalResults
  } = useSmartTrailerSearch({ 
    animeTitle, 
    autoSearch: !cachedResults, // Only auto-search if no cached results
    maxResults: 8
  });
  
  // Cache results when data is fetched
  useEffect(() => {
    if (trailers && trailers.length > 0) {
      setCachedResults(trailers);
    }
  }, [trailers, animeTitle]);
  
  const results = cachedResults || trailers || [];
  
  // Group results by type
  const officialTrailers = getTrailersByType('official');
  const reviews = getTrailersByType('review');
  const explanations = getTrailersByType('explanation');
  const bestTrailer = getBestTrailer();
  
  // Don't render if no results and not loading
  if (!loading && totalResults === 0) {
    return null;
  }
  
  // Determine default tab
  const getDefaultTab = () => {
    if (hasOfficialTrailer) return 'official';
    if (hasReviews) return 'reviews';
    if (hasExplanations) return 'explanations';
    return 'official';
  };
  
  if (loading) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm shadow-lg", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TrailerSkeleton />
          <TrailerSkeleton />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm shadow-lg", className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unable to load video content: {error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshSearch}
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm shadow-lg", className)}>
      <CardHeader>
        {hasOfficialTrailer || (reviews.length > 0 || explanations.length > 0) ? (
          <>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Videos & Reviews
            </CardTitle>
            {!hasOfficialTrailer && (hasReviews || hasExplanations) && (
              <p className="text-sm text-muted-foreground">
                No official trailer available - Here's what reviewers are saying:
              </p>
            )}
          </>
        ) : (
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Videos & Reviews
          </CardTitle>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger 
              value="official" 
              className="flex items-center gap-2"
              disabled={!hasOfficialTrailer}
            >
              <Play className="w-4 h-4" />
              Official ({officialTrailers.length})
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="flex items-center gap-2"
              disabled={!hasReviews}
            >
              <MessageSquare className="w-4 h-4" />
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger 
              value="explanations" 
              className="flex items-center gap-2"
              disabled={!hasExplanations}
            >
              <Users className="w-4 h-4" />
              Explanations ({explanations.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="official" className="mt-4">
            {hasOfficialTrailer ? (
              <div className="space-y-3">
                {officialTrailers.map((video, index) => (
                  <VideoCard key={video.videoId} video={video} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No official trailers found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-4">
            {hasReviews ? (
              <div className="space-y-3">
                {reviews.map((video, index) => (
                  <VideoCard key={video.videoId} video={video} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No reviews found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="explanations" className="mt-4">
            {hasExplanations ? (
              <div className="space-y-3">
                {explanations.map((video, index) => (
                  <VideoCard key={video.videoId} video={video} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No explanations found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Cache info */}
        {cachedResults && !loading && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Content cached • Updated automatically every 7 days
          </div>
        )}
      </CardContent>
    </Card>
  );
};