import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useGameification } from '@/hooks/useGameification';
import { 
  Star, 
  Heart, 
  Plus, 
  Zap, 
  Trophy,
  BookOpen,
  Play,
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface PointActivityProps {
  type: 'rate' | 'add_to_list' | 'complete' | 'review' | 'daily_goal';
  points: number;
  label: string;
  description?: string;
  itemId?: string;
  itemType?: 'anime' | 'manga';
  onComplete?: () => void;
  disabled?: boolean;
  variant?: 'button' | 'card';
  size?: 'sm' | 'default' | 'lg';
}

const activityIcons = {
  rate: Star,
  add_to_list: Plus,
  complete: CheckCircle,
  review: BookOpen,
  daily_goal: Trophy
};

const activityColors = {
  rate: 'text-yellow-500',
  add_to_list: 'text-primary',
  complete: 'text-green-500',
  review: 'text-purple-500',
  daily_goal: 'text-orange-500'
};

export const PointActivity = ({
  type,
  points,
  label,
  description,
  itemId,
  itemType = 'anime',
  onComplete,
  disabled = false,
  variant = 'button',
  size = 'default'
}: PointActivityProps) => {
  const { awardPoints } = useGameification();
  const [isAwarding, setIsAwarding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const Icon = activityIcons[type];
  const iconColor = activityColors[type];

  const handleAwardPoints = async () => {
    if (isAwarding || isCompleted || disabled) return;

    setIsAwarding(true);
    
    try {
      const success = await awardPoints(type, points, {
        itemId,
        itemType,
        timestamp: new Date().toISOString()
      });

      if (success) {
        setIsCompleted(true);
        
        // Show celebration toast
        toast.success(
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>+{points} points earned!</span>
          </div>,
          { duration: 3000 }
        );

        // Call completion callback
        onComplete?.();
      } else {
        toast.error('Failed to award points. Please try again.');
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsAwarding(false);
    }
  };

  if (variant === 'card') {
    return (
      <Card className={`border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-colors ${isCompleted ? 'border-green-500/50 bg-green-50/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-background/50 flex items-center justify-center ${isCompleted ? 'bg-green-100' : ''}`}>
                <Icon className={`w-5 h-5 ${isCompleted ? 'text-green-500' : iconColor}`} />
              </div>
              <div>
                <p className="font-medium">{label}</p>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                +{points}
              </Badge>
              <Button
                size="sm"
                onClick={handleAwardPoints}
                disabled={isAwarding || isCompleted || disabled}
                variant={isCompleted ? "secondary" : "default"}
              >
                {isAwarding ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isCompleted ? (
                  'Completed'
                ) : (
                  'Earn'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const buttonSizes = {
    sm: 'h-8 px-3 text-xs',
    default: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <Button
      size={size}
      onClick={handleAwardPoints}
      disabled={isAwarding || isCompleted || disabled}
      variant={isCompleted ? "secondary" : "default"}
      className={`${buttonSizes[size]} flex items-center gap-2 ${isCompleted ? 'text-green-600' : ''}`}
    >
      {isAwarding ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Icon className={`w-4 h-4 ${isCompleted ? 'text-green-500' : iconColor}`} />
      )}
      
      {isCompleted ? (
        'Completed'
      ) : (
        <>
          {label}
          <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
            +{points}
          </Badge>
        </>
      )}
    </Button>
  );
};