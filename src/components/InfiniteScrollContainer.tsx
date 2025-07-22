import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown } from 'lucide-react';

interface InfiniteScrollContainerProps {
  children: React.ReactNode;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  loading?: boolean;
  totalItems?: number;
  currentItems?: number;
  className?: string;
  enableAutoLoad?: boolean;
  threshold?: number;
}

export function InfiniteScrollContainer({
  children,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loading = false,
  totalItems = 0,
  currentItems = 0,
  className = '',
  enableAutoLoad = true,
  threshold = 200
}: InfiniteScrollContainerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage && enableAutoLoad) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, enableAutoLoad]);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !enableAutoLoad) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
      threshold: 0.1
    });

    observer.observe(trigger);

    return () => {
      observer.unobserve(trigger);
    };
  }, [handleIntersection, threshold, enableAutoLoad]);

  // Scroll position restoration
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('scrollPosition');
    if (savedPosition && containerRef.current) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition));
      }, 100);
    }

    const handleBeforeUnload = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {children}

      {/* Progress indicator */}
      {totalItems > 0 && (
        <div className="text-center text-sm text-muted-foreground mb-4">
          Showing {currentItems} of {totalItems} items
          {totalItems > currentItems && (
            <span className="ml-2">
              ({Math.round((currentItems / totalItems) * 100)}% loaded)
            </span>
          )}
        </div>
      )}

      {/* Loading trigger/manual load button */}
      <div ref={triggerRef} className="text-center py-8">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-muted-foreground">Loading more...</span>
          </div>
        ) : hasNextPage ? (
          <div className="space-y-4">
            {!enableAutoLoad && (
              <Button
                variant="outline"
                onClick={fetchNextPage}
                className="group"
                disabled={isFetchingNextPage}
              >
                Load More
                <ChevronDown className="w-4 h-4 ml-2 group-hover:translate-y-1 transition-transform" />
              </Button>
            )}
            {enableAutoLoad && (
              <div className="text-xs text-muted-foreground">
                Scroll down to load more
              </div>
            )}
          </div>
        ) : currentItems > 0 ? (
          <div className="text-muted-foreground">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
              ✨
            </div>
            You've reached the end!
          </div>
        ) : null}
      </div>
    </div>
  );
}