import { useState } from "react";
import { Play, Youtube, RefreshCw, Star, MessageSquare, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrailerPreview } from "./TrailerPreview";
import { useSmartTrailerSearch } from "@/hooks/useSmartTrailerSearch";

interface SmartTrailerSectionProps {
  animeTitle: string;
  className?: string;
}

export const SmartTrailerSection = ({ animeTitle, className = "" }: SmartTrailerSectionProps) => {
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
    autoSearch: true,
    maxResults: 9
  });

  const [activeTab, setActiveTab] = useState("all");

  const officialTrailers = getTrailersByType('official');
  const reviews = getTrailersByType('review');
  const explanations = getTrailersByType('explanation');
  const bestTrailer = getBestTrailer();

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'official':
        return <Star className="w-4 h-4" />;
      case 'review':
        return <MessageSquare className="w-4 h-4" />;
      case 'explanation':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Youtube className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'official':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'review':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'explanation':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className={`border-primary/20 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Finding the best trailers and reviews...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-destructive/20 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <Youtube className="w-8 h-8 mx-auto text-destructive opacity-50" />
            <p className="text-destructive">Failed to load trailers</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshSearch}
              className="border-destructive/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalResults === 0) {
    return (
      <Card className={`border-muted ${className}`}>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <Youtube className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No trailers or reviews found</p>
            <p className="text-sm text-muted-foreground">
              We couldn't find any trailers or YouTuber reviews for "{animeTitle}"
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshSearch}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Search Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            Trailers & Reviews
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshSearch}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        {searchResult && (
          <div className="flex flex-wrap gap-2">
            {hasOfficialTrailer && (
              <Badge className={getTypeColor('official')}>
                <Star className="w-3 h-3 mr-1" />
                {officialTrailers.length} Official
              </Badge>
            )}
            {hasReviews && (
              <Badge className={getTypeColor('review')}>
                <MessageSquare className="w-3 h-3 mr-1" />
                {reviews.length} Review{reviews.length > 1 ? 's' : ''}
              </Badge>
            )}
            {hasExplanations && (
              <Badge className={getTypeColor('explanation')}>
                <BookOpen className="w-3 h-3 mr-1" />
                {explanations.length} Explanation{explanations.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {/* Featured/Best Trailer */}
        {bestTrailer && (
          <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getTypeColor(bestTrailer.type)}>
                {getTabIcon(bestTrailer.type)}
                <span className="ml-1 capitalize">{bestTrailer.type}</span>
              </Badge>
              {bestTrailer.youtuber && (
                <Badge variant="outline">
                  {bestTrailer.youtuber}
                </Badge>
              )}
            </div>
            <div className="flex gap-4">
              <TrailerPreview
                videoId={bestTrailer.videoId}
                title={bestTrailer.title}
                thumbnail={bestTrailer.thumbnail}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                  {bestTrailer.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {bestTrailer.channelTitle}
                </p>
                {bestTrailer.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {bestTrailer.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All Results Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              <Youtube className="w-3 h-3 mr-1" />
              All ({totalResults})
            </TabsTrigger>
            <TabsTrigger value="official" disabled={!hasOfficialTrailer} className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              Official ({officialTrailers.length})
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!hasReviews} className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="explanation" disabled={!hasExplanations} className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              Explanations ({explanations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {trailers.map((trailer) => (
                <div key={trailer.videoId} className="space-y-2">
                  <div className="relative">
                    <TrailerPreview
                      videoId={trailer.videoId}
                      title={trailer.title}
                      thumbnail={trailer.thumbnail}
                      size="sm"
                    />
                    <Badge 
                      className={`absolute top-1 left-1 text-xs ${getTypeColor(trailer.type)}`}
                    >
                      {trailer.type === 'official' && <Star className="w-2 h-2 mr-1" />}
                      {trailer.type === 'review' && <MessageSquare className="w-2 h-2 mr-1" />}
                      {trailer.type === 'explanation' && <BookOpen className="w-2 h-2 mr-1" />}
                      {trailer.type}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium line-clamp-2">{trailer.title}</p>
                    <p className="text-xs text-muted-foreground">{trailer.channelTitle}</p>
                    {trailer.youtuber && (
                      <Badge variant="outline" className="text-xs">
                        {trailer.youtuber}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="official" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {officialTrailers.map((trailer) => (
                <div key={trailer.videoId} className="space-y-2">
                  <TrailerPreview
                    videoId={trailer.videoId}
                    title={trailer.title}
                    thumbnail={trailer.thumbnail}
                    size="sm"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-medium line-clamp-2">{trailer.title}</p>
                    <p className="text-xs text-muted-foreground">{trailer.channelTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="review" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {reviews.map((trailer) => (
                <div key={trailer.videoId} className="space-y-2">
                  <TrailerPreview
                    videoId={trailer.videoId}
                    title={trailer.title}
                    thumbnail={trailer.thumbnail}
                    size="sm"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-medium line-clamp-2">{trailer.title}</p>
                    <p className="text-xs text-muted-foreground">{trailer.channelTitle}</p>
                    {trailer.youtuber && (
                      <Badge variant="outline" className="text-xs">
                        {trailer.youtuber}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="explanation" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {explanations.map((trailer) => (
                <div key={trailer.videoId} className="space-y-2">
                  <TrailerPreview
                    videoId={trailer.videoId}
                    title={trailer.title}
                    thumbnail={trailer.thumbnail}
                    size="sm"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-medium line-clamp-2">{trailer.title}</p>
                    <p className="text-xs text-muted-foreground">{trailer.channelTitle}</p>
                    {trailer.youtuber && (
                      <Badge variant="outline" className="text-xs">
                        {trailer.youtuber}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};