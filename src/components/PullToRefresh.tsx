import { useState, useRef, useEffect, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useNativeActions } from '@/hooks/useNativeActions';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh = ({
  onRefresh,
  children,
  className,
  disabled = false,
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const { hapticFeedback } = useNativeActions();

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  const canPull = () => {
    if (disabled || isRefreshing) return false;
    
    const container = containerRef.current;
    if (!container) return false;
    
    return container.scrollTop === 0;
  };

  const handleStart = (clientY: number) => {
    if (!canPull()) return;
    
    setIsPulling(true);
    startYRef.current = clientY;
  };

  const handleMove = (clientY: number) => {
    if (!isPulling || !canPull()) return;

    const deltaY = clientY - startYRef.current;
    if (deltaY < 0) return; // Only allow downward pulls

    const distance = Math.min(deltaY * 0.6, MAX_PULL); // Add resistance
    setPullDistance(distance);

    // Trigger haptic feedback when crossing threshold
    if (distance >= PULL_THRESHOLD && pullDistance < PULL_THRESHOLD) {
      hapticFeedback('light');
    }
  };

  const handleEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      await hapticFeedback('medium');
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse events (for desktop testing)
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPulling) {
      handleMove(e.clientY);
    }
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPulling) {
        handleMove(e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isPulling) {
        handleEnd();
      }
    };

    if (isPulling) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPulling]);

  const refreshProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const shouldTrigger = pullDistance >= PULL_THRESHOLD;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-auto h-full",
        "touch-manipulation",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-10",
          "flex items-center justify-center",
          "bg-background/90 backdrop-blur-sm",
          "transition-opacity duration-200",
          (pullDistance > 0 || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
        }}
      >
        <div className={cn(
          "flex items-center gap-2 text-sm",
          shouldTrigger || isRefreshing ? "text-primary" : "text-muted-foreground"
        )}>
          <RefreshCw 
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              (isRefreshing || shouldTrigger) && "animate-spin"
            )}
            style={{
              transform: `rotate(${refreshProgress * 180}deg)`,
            }}
          />
          <span>
            {isRefreshing 
              ? "Refreshing..." 
              : shouldTrigger 
                ? "Release to refresh" 
                : "Pull to refresh"
            }
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};