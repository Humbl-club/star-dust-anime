import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Play, Check, Clock, RotateCcw } from 'lucide-react';
import { useUserTitleLists } from '@/hooks/useUserTitleLists';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { type UserTitleListEntry } from '@/types/userLists';
import { toast } from 'sonner';

interface ProgressTrackerProps {
  item: UserTitleListEntry;
  showDetails?: boolean;
  compact?: boolean;
}

export function ProgressTracker({ item, showDetails = true, compact = false }: ProgressTrackerProps) {
  const { updateAnimeListEntry, updateMangaListEntry, listStatuses } = useUserTitleLists();
  const { scheduleUserListUpdate } = useBackgroundSync();
  const [inputProgress, setInputProgress] = useState(item.progress || 0);
  const [isEditing, setIsEditing] = useState(false);

  const isAnime = item.media_type === 'anime';
  const details = isAnime ? (item as any).anime_details : (item as any).manga_details;
  
  const getMaxProgress = () => {
    if (isAnime) {
      return details?.episodes || 24;
    } else {
      return details?.chapters || 50;
    }
  };

  const getCurrentProgress = () => item.progress || 0;
  const maxProgress = getMaxProgress();
  const currentProgress = getCurrentProgress();
  const progressPercentage = Math.min((currentProgress / maxProgress) * 100, 100);
  
  const isCompleted = currentProgress >= maxProgress;
  const canIncrement = currentProgress < maxProgress;
  const canDecrement = currentProgress > 0;

  const updateProgress = useCallback(async (newProgress: number) => {
    const clampedProgress = Math.max(0, Math.min(newProgress, maxProgress));
    
    // Update progress
    const updates: any = { progress: clampedProgress };
    
    // Auto-update status if completed
    if (clampedProgress >= maxProgress && !isCompleted) {
      const completedStatus = listStatuses.find(s => 
        (s.media_type === item.media_type || s.media_type === 'both') && 
        s.name === 'completed'
      );
      if (completedStatus) {
        updates.status_id = completedStatus.id;
      }
    }
    
    if (isAnime) {
      updateAnimeListEntry(item.title_id, updates);
    } else {
      updateMangaListEntry(item.title_id, updates);
    }
    
    scheduleUserListUpdate({ ...item, ...updates });
    
    if (clampedProgress >= maxProgress && !isCompleted) {
      toast.success(`🎉 Completed ${isAnime ? 'anime' : 'manga'}!`);
    } else {
      const unit = isAnime ? 'episode' : 'chapter';
      toast.success(`Progress updated: ${clampedProgress}/${maxProgress} ${unit}s`);
    }
  }, [item, maxProgress, isCompleted, isAnime, updateAnimeListEntry, updateMangaListEntry, scheduleUserListUpdate, listStatuses]);

  const handleIncrement = () => {
    if (canIncrement) {
      updateProgress(currentProgress + 1);
    }
  };

  const handleDecrement = () => {
    if (canDecrement) {
      updateProgress(currentProgress - 1);
    }
  };

  const handleInputChange = (value: string) => {
    const num = parseInt(value) || 0;
    setInputProgress(Math.max(0, Math.min(num, maxProgress)));
  };

  const handleSaveInput = () => {
    updateProgress(inputProgress);
    setIsEditing(false);
  };

  const handleCancelInput = () => {
    setInputProgress(currentProgress);
    setIsEditing(false);
  };

  const handleMarkComplete = () => {
    updateProgress(maxProgress);
  };

  const handleReset = () => {
    updateProgress(0);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecrement}
          disabled={!canDecrement}
        >
          <Minus className="w-3 h-3" />
        </Button>
        
        <div className="text-sm font-medium min-w-[80px] text-center">
          {currentProgress}/{maxProgress}
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleIncrement}
          disabled={!canIncrement}
        >
          <Plus className="w-3 h-3" />
        </Button>
        
        {!isCompleted && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleMarkComplete}
            className="text-xs"
          >
            <Check className="w-3 h-3 mr-1" />
            Complete
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isAnime ? <Play className="w-5 h-5" /> : <div className="w-5 h-5 text-center">📖</div>}
            Progress Tracker
          </CardTitle>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <Check className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
            <Badge variant="outline">
              {isAnime ? 'Anime' : 'Manga'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isAnime ? 'Episodes' : 'Chapters'} Watched/Read
            </span>
            <span className="font-medium">
              {currentProgress} of {maxProgress}
            </span>
          </div>
          
          <Progress value={progressPercentage} className="h-3" />
          
          <div className="text-xs text-muted-foreground text-center">
            {progressPercentage.toFixed(1)}% Complete
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={inputProgress}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-20 h-8 text-center"
                min={0}
                max={maxProgress}
              />
              <Button size="sm" onClick={handleSaveInput}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelInput}>
                ✕
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecrement}
                disabled={!canDecrement}
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="font-mono text-lg min-w-[100px]"
              >
                {currentProgress}/{maxProgress}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleIncrement}
                disabled={!canIncrement}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-2">
          {!isCompleted && (
            <Button
              size="sm"
              onClick={handleMarkComplete}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
          
          {currentProgress > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {/* Additional Info */}
        {showDetails && (
          <div className="pt-3 border-t space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <div className="font-medium">{details?.type || 'Unknown'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="font-medium">{details?.status || 'Unknown'}</div>
              </div>
            </div>
            
            {details?.aired_from && (
              <div className="text-sm">
                <span className="text-muted-foreground">Aired:</span>
                <span className="ml-2 font-medium">
                  {new Date(details.aired_from).getFullYear()}
                </span>
              </div>
            )}
            
            {details?.published_from && (
              <div className="text-sm">
                <span className="text-muted-foreground">Published:</span>
                <span className="ml-2 font-medium">
                  {new Date(details.published_from).getFullYear()}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}