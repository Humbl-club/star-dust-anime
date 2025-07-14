
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users, Heart, Play, Book, BookOpen } from 'lucide-react';

interface DetailStatsBarProps {
  score?: number;
  anilistScore?: number;
  members?: number;
  favorites?: number;
  episodes?: number;
  chapters?: number;
  volumes?: number;
  colorTheme?: string;
  contentType: 'anime' | 'manga';
}

export const DetailStatsBar = ({ 
  score, 
  anilistScore, 
  members, 
  favorites, 
  episodes, 
  chapters, 
  volumes, 
  colorTheme,
  contentType 
}: DetailStatsBarProps) => {
  const displayScore = score || anilistScore;
  
  if (!displayScore && !members && !favorites && !episodes && !chapters && !volumes) {
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
          {displayScore && (
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {displayScore}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Star className="w-3 h-3" />
                Score
              </div>
            </div>
          )}
          
          {members && (
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-1">
                {(members / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="w-3 h-3" />
                Members
              </div>
            </div>
          )}
          
          {favorites && (
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-1">
                {(favorites / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Heart className="w-3 h-3" />
                Favorites
              </div>
            </div>
          )}
          
          {contentType === 'anime' && episodes && (
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-glow mb-1">{episodes}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Play className="w-3 h-3" />
                Episodes
              </div>
            </div>
          )}
          
          {contentType === 'manga' && chapters && (
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-glow mb-1">{chapters}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Book className="w-3 h-3" />
                Chapters
              </div>
            </div>
          )}
          
          {contentType === 'manga' && volumes && (
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-glow mb-1">{volumes}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3" />
                Volumes
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
