import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RatingComponent } from '@/components/RatingComponent';
import { AddToListButton } from '@/components/AddToListButton';
import { FillerIndicator } from '@/components/FillerIndicator';
import { useFillerData } from '@/hooks/useFillerData';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SkipForward, Info } from 'lucide-react';
import { type Anime } from '@/data/animeData';
import { type UserAnimeListEntry } from '@/hooks/useUserLists';

interface AnimeListItemProps {
  entry: UserAnimeListEntry;
  anime: Anime;
  onUpdate: (id: string, updates: Partial<UserAnimeListEntry>) => void;
  StatusIcon: React.ComponentType<{ className?: string }>;
  statusColor: string;
  statusLabel: string;
  hideFillerContent: boolean;
}

export function AnimeListItem({
  entry,
  anime,
  onUpdate,
  StatusIcon,
  statusColor,
  statusLabel,
  hideFillerContent
}: AnimeListItemProps) {
  const { 
    fillerData, 
    isLoading: fillerLoading, 
    getMainStoryProgress, 
    getNextMainStoryEpisode,
    isFillerEpisode 
  } = useFillerData(anime.title);

  const [showFillerDetails, setShowFillerDetails] = useState(false);

  // Calculate progress based on filler filtering
  const progressInfo = getMainStoryProgress(entry.episodes_watched || 0);
  const nextMainStoryEp = getNextMainStoryEpisode(entry.episodes_watched || 0);
  
  // Show current episode filler status
  const currentEpIsFiller = entry.episodes_watched ? isFillerEpisode(entry.episodes_watched) : false;

  const handleSkipToMainStory = () => {
    if (nextMainStoryEp) {
      onUpdate(entry.id, { episodes_watched: nextMainStoryEp });
    }
  };

  const progressPercentage = anime.episodes 
    ? hideFillerContent 
      ? (progressInfo.mainStoryEpisodes / (fillerData?.filter(ep => !ep.filler).length || anime.episodes)) * 100
      : (entry.episodes_watched || 0) / anime.episodes * 100
    : 0;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <img 
            src={anime.image_url}
            alt={anime.title}
            className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold line-clamp-1">{anime.title}</h3>
              <AddToListButton item={anime} type="anime" />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className={`${statusColor} text-white`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusLabel}
              </Badge>
              
              <Badge variant="outline">
                {anime.type} • {anime.year}
              </Badge>

              {/* Current episode filler indicator */}
              {fillerData && entry.episodes_watched && (
                <FillerIndicator 
                  isFiller={currentEpIsFiller}
                  episode={entry.episodes_watched}
                  size="sm"
                />
              )}
            </div>

            {/* Progress Bar */}
            {anime.episodes && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Episodes Watched
                </label>
                <div className="space-y-2">
                  <div className="text-lg">
                    {entry.episodes_watched} / {anime.episodes || "?"}
                  </div>
                  
                  {/* Main story progress when filler data is available */}
                  {fillerData && hideFillerContent && (
                    <div className="text-sm text-muted-foreground">
                      Main Story: {progressInfo.mainStoryEpisodes} / {fillerData.filter(ep => !ep.filler).length}
                    </div>
                  )}

                  {/* Skip to next main story episode button */}
                  {fillerData && currentEpIsFiller && nextMainStoryEp && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleSkipToMainStory}
                            className="text-xs"
                          >
                            <SkipForward className="w-3 h-3 mr-1" />
                            Skip to Ep {nextMainStoryEp}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Skip current filler episode and jump to next main story episode</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Your Rating
                </label>
                <RatingComponent
                  value={entry.score || 0}
                  onChange={(rating) => onUpdate(entry.id, { score: rating })}
                  size="sm"
                />
              </div>
            </div>

            {/* Filler information toggle */}
            {fillerData && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFillerDetails(!showFillerDetails)}
                  className="text-xs"
                >
                  <Info className="w-3 h-3 mr-1" />
                  {showFillerDetails ? 'Hide' : 'Show'} Filler Details
                </Button>
                
                {showFillerDetails && (
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <div>Total Episodes: {anime.episodes}</div>
                    <div>Main Story Episodes: {fillerData.filter(ep => !ep.filler).length}</div>
                    <div>Filler Episodes: {fillerData.filter(ep => ep.filler).length}</div>
                    {entry.episodes_watched && (
                      <div>Main Story Progress: {progressInfo.mainStoryEpisodes} episodes</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {fillerLoading && (
              <div className="mt-2 text-xs text-muted-foreground">
                Loading filler data...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}