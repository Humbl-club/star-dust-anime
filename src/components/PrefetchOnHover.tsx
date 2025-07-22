import { useEffect, useRef } from 'react';
import { CacheManager } from '@/utils/cacheManager';
import { useQueryClient } from '@tanstack/react-query';

interface PrefetchOnHoverProps {
  contentId: string;
  contentType: 'anime' | 'manga';
  children: React.ReactElement;
  delay?: number;
}

export function PrefetchOnHover({ 
  contentId, 
  contentType, 
  children, 
  delay = 500 
}: PrefetchOnHoverProps) {
  const queryClient = useQueryClient();
  const cacheManager = CacheManager.getInstance(queryClient);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const prefetchedRef = useRef(false);

  const handleMouseEnter = () => {
    if (prefetchedRef.current) return;

    timeoutRef.current = setTimeout(() => {
      cacheManager.prefetchOnHover(contentId, contentType, 0);
      prefetchedRef.current = true;
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full"
    >
      {children}
    </div>
  );
}