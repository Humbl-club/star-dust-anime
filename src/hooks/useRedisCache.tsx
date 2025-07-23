import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CacheOptions {
  ttl?: number; // seconds
  forceRefresh?: boolean;
}

export function useRedisCache<T>(
  key: string[],
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: [...key, 'redis-cached'],
    queryFn: async () => {
      try {
        // First, try to get from edge function cache
        const { data: cached } = await supabase.functions.invoke('cache-get', {
          body: { key: key.join(':') }
        });
        
        if (cached && !options.forceRefresh) {
          return cached as T;
        }
        
        // Cache miss or force refresh - fetch fresh data
        const freshData = await fetchFn();
        
        // Update cache asynchronously
        supabase.functions.invoke('cache-set', {
          body: { 
            key: key.join(':'), 
            value: freshData,
            ttl: options.ttl || 300 
          }
        });
        
        return freshData;
      } catch (error) {
        // Fallback to direct fetch if cache service fails
        return fetchFn();
      }
    },
    staleTime: (options.ttl || 300) * 1000,
    gcTime: (options.ttl || 300) * 2 * 1000,
  });
}