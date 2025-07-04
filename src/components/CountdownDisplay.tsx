import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Calendar, 
  Bell, 
  BellOff, 
  Play, 
  BookOpen, 
  Zap,
  Timer,
  Globe
} from "lucide-react";
import { countdownService, CountdownData, TimeRemaining } from "@/services/countdownService";
import { toast } from "sonner";

interface CountdownDisplayProps {
  countdown: CountdownData;
  showNotifications?: boolean;
  compact?: boolean;
  className?: string;
  onNotificationToggle?: (enabled: boolean) => void;
}

export const CountdownDisplay = ({ 
  countdown, 
  showNotifications = true,
  compact = false,
  className = "",
  onNotificationToggle
}: CountdownDisplayProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isLive: false, hasEnded: false
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    countdownService.registerCountdown(countdown, (newTimeRemaining) => {
      setTimeRemaining(newTimeRemaining);
      
      // Trigger notification for critical moments
      if (newTimeRemaining.isLive && !timeRemaining.isLive && notificationsEnabled) {
        const message = countdownService.generateNotificationMessage(countdown, newTimeRemaining);
        toast.success(message, { duration: 10000 });
      }
    });

    return () => {
      countdownService.unregisterCountdown(countdown.id);
    };
  }, [countdown.id]);

  const handleNotificationToggle = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    onNotificationToggle?.(newState);
    
    toast.success(
      newState ? 'Notifications enabled' : 'Notifications disabled',
      { duration: 3000 }
    );
  };

  const getStatusColor = () => {
    if (timeRemaining.hasEnded) return 'text-muted-foreground';
    if (timeRemaining.isLive) return 'text-green-500';
    if (timeRemaining.totalSeconds <= 3600) return 'text-orange-500'; // 1 hour
    if (timeRemaining.totalSeconds <= 86400) return 'text-yellow-500'; // 1 day
    return 'text-primary';
  };

  const getStatusBadgeVariant = () => {
    if (timeRemaining.hasEnded) return 'secondary';
    if (timeRemaining.isLive) return 'default';
    if (timeRemaining.totalSeconds <= 3600) return 'destructive';
    return 'outline';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="flex items-center gap-1">
          {countdown.type === 'anime' ? 
            <Play className="w-3 h-3" /> : 
            <BookOpen className="w-3 h-3" />
          }
          <span className="font-medium truncate max-w-[120px]" title={countdown.title}>
            {countdown.title}
          </span>
        </div>
        
        <Badge variant={getStatusBadgeVariant()} className="text-xs px-2 py-0.5">
          {countdownService.formatCountdown(timeRemaining)}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                countdown.type === 'anime' ? 'bg-primary/10' : 'bg-secondary/10'
              }`}>
                {countdown.type === 'anime' ? 
                  <Play className="w-4 h-4 text-primary" /> : 
                  <BookOpen className="w-4 h-4 text-secondary" />
                }
              </div>
              
              <div>
                <h4 className="font-semibold text-sm line-clamp-1" title={countdown.title}>
                  {countdown.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {countdown.type === 'anime' 
                    ? `Episode ${countdown.episodeNumber || '?'}`
                    : `Chapter ${countdown.chapterNumber || '?'}`
                  }
                </p>
              </div>
            </div>

            {/* Notification Toggle */}
            {showNotifications && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNotificationToggle}
                className="h-8 w-8 p-0"
                title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
              >
                {notificationsEnabled ? 
                  <Bell className="w-4 h-4 text-primary" /> : 
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                }
              </Button>
            )}
          </div>

          {/* Countdown Display */}
          <div className="text-center space-y-2">
            {timeRemaining.isLive ? (
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-green-500 animate-pulse" />
                <span className="text-xl font-bold text-green-500">LIVE NOW!</span>
              </div>
            ) : timeRemaining.hasEnded ? (
              <div className="text-lg font-semibold text-muted-foreground">
                Released
              </div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${getStatusColor()}`}>
                  {countdownService.formatCountdown(timeRemaining)}
                </div>
                
                {/* Detailed breakdown for longer countdowns */}
                {timeRemaining.totalSeconds > 3600 && (
                  <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                    {timeRemaining.days > 0 && (
                      <div className="text-center">
                        <div className="font-semibold">{timeRemaining.days}</div>
                        <div>day{timeRemaining.days !== 1 ? 's' : ''}</div>
                      </div>
                    )}
                    {timeRemaining.hours > 0 && (
                      <div className="text-center">
                        <div className="font-semibold">{timeRemaining.hours}</div>
                        <div>hour{timeRemaining.hours !== 1 ? 's' : ''}</div>
                      </div>
                    )}
                    {timeRemaining.minutes > 0 && (
                      <div className="text-center">
                        <div className="font-semibold">{timeRemaining.minutes}</div>
                        <div>min{timeRemaining.minutes !== 1 ? 's' : ''}</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex justify-between items-center text-xs">
            <Badge variant={getStatusBadgeVariant()}>
              {countdownService.getRelativeDescription(timeRemaining)}
            </Badge>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <Globe className="w-3 h-3" />
              <span>{countdownService.getTimeZoneOffset()}</span>
            </div>
          </div>

          {/* Release Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {countdownService.formatInUserTimeZone(countdown.releaseDate)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};