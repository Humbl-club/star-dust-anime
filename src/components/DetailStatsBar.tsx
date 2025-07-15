
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users, Heart, Play, Book, BookOpen, Vote } from 'lucide-react';

interface DetailStatsBarProps {
  score?: number;
  anilistScore?: number;
  episodes?: number;
  chapters?: number;
  volumes?: number;
  colorTheme?: string;
  contentType: 'anime' | 'manga';
}

export const DetailStatsBar = ({
  score,
  anilistScore,
  episodes,
  chapters,
  volumes,
  colorTheme,
  contentType
}: DetailStatsBarProps) => {
  // Return null if no data is available
  if (!score && !anilistScore && !episodes && !chapters && !volumes) {
    return null;
  }

  return (
    <Card 
      className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 animate-fade-in" 
      style={{ 
        animationDelay: '0.3s',
        borderColor: colorTheme ? `${colorTheme}30` : undefined
      }}
    >
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* AniList Score */}
          {anilistScore && (
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-4 w-4 text-primary" fill="currentColor" />
                <span className="text-lg font-bold text-primary">{anilistScore}</span>
              </div>
              <p className="text-xs text-muted-foreground">AniList Score</p>
            </div>
          )}

          {/* Community Score (if different from AniList) */}
          {score && score !== anilistScore && (
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold text-primary">{score}</span>
              </div>
              <p className="text-xs text-muted-foreground">Community Score</p>
            </div>
          )}
          
          {contentType === 'anime' && episodes && (
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Play className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold text-primary">{episodes}</span>
              </div>
              <p className="text-xs text-muted-foreground">Episodes</p>
            </div>
          )}
          
          {contentType === 'manga' && chapters && (
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Book className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold text-primary">{chapters}</span>
              </div>
              <p className="text-xs text-muted-foreground">Chapters</p>
            </div>
          )}
          
          {contentType === 'manga' && volumes && (
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold text-primary">{volumes}</span>
              </div>
              <p className="text-xs text-muted-foreground">Volumes</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
