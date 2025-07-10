import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, Star } from 'lucide-react';
import { useNativeActions } from '@/hooks/useNativeActions';
import { cn } from '@/lib/utils';

interface SwipeableListItemProps {
  title: string;
  imageUrl?: string;
  progress?: { current: number; total: number };
  status?: string;
  onMarkWatched?: () => void;
  onRemove?: () => void;
  onView?: () => void;
  onRate?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const SwipeableListItem = ({
  title,
  imageUrl,
  progress,
  status,
  onMarkWatched,
  onRemove,
  onView,
  onRate,
  children,
  className,
}: SwipeableListItemProps) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [actionTriggered, setActionTriggered] = useState<'watched' | 'remove' | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const { hapticFeedback } = useNativeActions();

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 120;

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    setActionTriggered(null);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;

    const deltaX = clientX - startXRef.current;
    const constrainedX = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
    setSwipeX(constrainedX);

    // Trigger haptic feedback when crossing thresholds
    const newAction = 
      constrainedX > SWIPE_THRESHOLD ? 'watched' :
      constrainedX < -SWIPE_THRESHOLD ? 'remove' :
      null;

    if (newAction !== actionTriggered) {
      setActionTriggered(newAction);
      if (newAction) {
        hapticFeedback('light');
      }
    }
  };

  const handleEnd = async () => {
    setIsDragging(false);

    if (Math.abs(swipeX) > SWIPE_THRESHOLD) {
      await hapticFeedback('medium');
      
      if (swipeX > SWIPE_THRESHOLD && onMarkWatched) {
        onMarkWatched();
      } else if (swipeX < -SWIPE_THRESHOLD && onRemove) {
        onRemove();
      }
    }

    setSwipeX(0);
    setActionTriggered(null);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        {/* Mark as Watched (Right swipe) */}
        <div className={cn(
          "flex items-center gap-2 text-green-500 transition-opacity duration-200",
          actionTriggered === 'watched' ? "opacity-100" : "opacity-50"
        )}>
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">Mark Watched</span>
        </div>

        {/* Remove (Left swipe) */}
        <div className={cn(
          "flex items-center gap-2 text-red-500 transition-opacity duration-200",
          actionTriggered === 'remove' ? "opacity-100" : "opacity-50"
        )}>
          <span className="text-sm font-medium">Remove</span>
          <X className="w-5 h-5" />
        </div>
      </div>

      {/* Main Content */}
      <Card
        ref={itemRef}
        className={cn(
          "relative z-10 transition-transform duration-200 ease-out",
          "touch-manipulation select-none cursor-grab active:cursor-grabbing",
          isDragging && "transition-none"
        )}
        style={{
          transform: `translateX(${swipeX}px)`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-3 p-4">
          {/* Image */}
          {imageUrl && (
            <div className="flex-shrink-0 w-12 h-16 overflow-hidden rounded-lg">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate text-sm">{title}</h3>
            
            {progress && (
              <div className="text-xs text-muted-foreground mt-1">
                {progress.current} / {progress.total} episodes
              </div>
            )}

            {status && (
              <div className="text-xs text-muted-foreground mt-1">
                Status: {status}
              </div>
            )}

            {children}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={onView}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={onRate}
            >
              <Star className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};