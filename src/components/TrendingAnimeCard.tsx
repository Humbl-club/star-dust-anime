import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { StatusIndicator } from './StatusIndicator';
import { useCountdown } from '@/hooks/useCountdown';
import { Clock, Star, Calendar, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Content {
  id: string;
  title: string;
  title_english?: string;
  image_url?: string;
  score?: number;
  popularity?: number;
  status: string;
  season?: string;
  next_episode_date?: string;
  next_episode_number?: number;
  next_chapter_date?: string;
  next_chapter_number?: number;
  episodes?: number;
  chapters?: number;
  status_indicator?: 'NEW' | 'FINALE_SOON' | 'ENDING_SOON';
  trending_score: number;
}

interface TrendingAnimeCardProps {
  content: Content;
  contentType: 'anime' | 'manga';
}

export const TrendingAnimeCard: React.FC<TrendingAnimeCardProps> = ({ content, contentType }) => {
  const navigate = useNavigate();
  
  // Get next release countdown
  const nextDate = contentType === 'anime' ? content.next_episode_date : content.next_chapter_date;
  const { timeLeft, isExpired } = useCountdown(nextDate ? new Date(nextDate) : null);
  
  const handleClick = () => {
    const slug = content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    navigate(`/${contentType}/${slug}`, { 
      state: { 
        id: content.id,
        anilist_id: content.id 
      } 
    });
  };

  const getDisplayTitle = () => {
    return content.title_english || content.title;
  };

  const getEpisodeProgress = () => {
    if (contentType === 'manga' || !content.episodes || !content.next_episode_number) return null;
    
    const progress = (content.next_episode_number - 1) / content.episodes * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getChapterProgress = () => {
    if (contentType === 'anime' || !content.chapters || !content.next_chapter_number) return null;
    
    const progress = content.next_chapter_number / content.chapters * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const progress = contentType === 'anime' ? getEpisodeProgress() : getChapterProgress();

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-border/50 hover:border-primary/20"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
          <img
            src={content.image_url || '/placeholder.svg'}
            alt={getDisplayTitle()}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Status Indicators */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {content.status_indicator && (
              <StatusIndicator status={content.status_indicator} />
            )}
            {content.score && (
              <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/80">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                {content.score.toFixed(1)}
              </Badge>
            )}
          </div>

          {/* Next Episode/Chapter Countdown */}
          {nextDate && !isExpired && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-xs backdrop-blur-sm bg-background/90">
                <Clock className="h-3 w-3 mr-1" />
                {timeLeft}
              </Badge>
            </div>
          )}

          {/* Progress Bar Overlay */}
          {progress !== null && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/80 to-transparent">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                {contentType === 'anime' ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                <span>
                  {contentType === 'anime' 
                    ? `Ep ${content.next_episode_number - 1}/${content.episodes || '?'}`
                    : `Ch ${content.next_chapter_number}/${content.chapters || '?'}`
                  }
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {getDisplayTitle()}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{content.status.replace('_', ' ')}</span>
            {content.season && (
              <Badge variant="outline" className="text-xs">
                {content.season}
              </Badge>
            )}
          </div>

          {/* Next Release Info */}
          {nextDate && (
            <div className="mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Next {contentType === 'anime' ? 'episode' : 'chapter'}: {timeLeft}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};