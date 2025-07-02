import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Play } from "lucide-react";

interface CountdownTimerProps {
  nextDate: string | null;
  nextEpisode?: number | null;
  nextChapter?: number | null;
  status: string;
  title: string;
  type: 'anime' | 'manga';
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const CountdownTimer = ({ 
  nextDate, 
  nextEpisode, 
  nextChapter, 
  status, 
  title,
  type 
}: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isLive, setIsLive] = useState(false);

  const calculateTimeRemaining = (targetDate: string): TimeRemaining => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference
      };
    }
    
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  };

  useEffect(() => {
    if (!nextDate) {
      setTimeRemaining(null);
      return;
    }

    // Don't show countdown for completed or cancelled series
    const inactiveStatuses = ['FINISHED', 'CANCELLED', 'NOT_YET_RELEASED', 'HIATUS', 'Finished Airing', 'Completed', 'On Hold'];
    if (inactiveStatuses.some(s => status?.toUpperCase().includes(s.toUpperCase()))) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remaining = calculateTimeRemaining(nextDate);
      setTimeRemaining(remaining);
      
      // Check if we just hit the release time (within 1 minute)
      if (remaining.total <= 60000 && remaining.total > 0) {
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [nextDate, status]);

  // Don't render if no countdown data or series is inactive
  if (!timeRemaining || !nextDate) {
    return null;
  }

  // Show "LIVE NOW" badge if within release window
  if (timeRemaining.total <= 0 || isLive) {
    return (
      <div className="glass-card p-3 space-y-2 animate-glow-pulse">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
          <Badge variant="destructive" className="animate-bounce">
            LIVE NOW!
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-accent">
          {type === 'anime' ? <Play className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
          <span className="font-medium">
            {type === 'anime' 
              ? `Episode ${nextEpisode} is out!` 
              : `Chapter ${nextChapter} is available!`
            }
          </span>
        </div>
      </div>
    );
  }

  const formatTimeUnit = (value: number, unit: string) => {
    if (value === 0) return null;
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-gradient-primary">
          {String(value).padStart(2, '0')}
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {unit}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-4 space-y-3 hover:scale-105 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          Next {type === 'anime' ? 'Episode' : 'Chapter'}
        </span>
        <Badge variant="outline" className="ml-auto">
          {type === 'anime' ? `EP ${nextEpisode}` : `CH ${nextChapter}`}
        </Badge>
      </div>

      {/* Countdown Display */}
      <div className="grid grid-cols-4 gap-2">
        {formatTimeUnit(timeRemaining.days, 'Days')}
        {formatTimeUnit(timeRemaining.hours, 'Hours')}
        {formatTimeUnit(timeRemaining.minutes, 'Min')}
        {formatTimeUnit(timeRemaining.seconds, 'Sec')}
      </div>

      {/* Release Date */}
      <div className="pt-2 border-t border-border/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>
            {new Date(nextDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="w-full bg-muted/30 rounded-full h-1">
        <div 
          className="bg-gradient-primary h-1 rounded-full transition-all duration-1000"
          style={{ 
            width: timeRemaining.days > 7 ? '10%' : 
                   timeRemaining.days > 3 ? '30%' : 
                   timeRemaining.days > 1 ? '60%' : 
                   timeRemaining.hours > 12 ? '80%' : '95%' 
          }}
        />
      </div>
    </div>
  );
};