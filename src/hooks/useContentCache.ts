import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CacheOptions {
  staleTime?: number;
  cacheTime?: number;
  refetchOnMount?: boolean;
}

export function useContentCache<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const queryClient = useQueryClient();
  
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 30 * 60 * 1000, // 30 minutes
    refetchOnMount = false
  } = options;

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`cache-${key.join('-')}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'titles' 
        }, 
        () => {
          // Invalidate cache on database changes
          queryClient.invalidateQueries({ queryKey: key });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [key, queryClient]);

  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime,
    gcTime: cacheTime, // Updated from cacheTime to gcTime for latest React Query
    refetchOnMount,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}