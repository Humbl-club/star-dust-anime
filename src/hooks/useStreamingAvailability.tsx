import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StreamingPlatform {
  name: string;
  url: string;
  type: 'subscription' | 'rent' | 'buy';
  price?: string;
  quality?: 'HD' | '4K';
  region: string;
}

interface StreamingAvailabilityData {
  available: boolean;
  platforms: StreamingPlatform[];
  lastChecked: string;
  dataSource: 'anilist' | 'justwatch' | 'webscrape';
}

interface UseStreamingAvailabilityOptions {
  titleId: string;
  titleName: string;
  region?: string;
  enabled?: boolean;
}

export const useStreamingAvailability = ({
  titleId,
  titleName,
  region = 'US',
  enabled = true
}: UseStreamingAvailabilityOptions) => {
  return useQuery<StreamingAvailabilityData>({
    queryKey: ['streaming-availability', titleId, region],
    queryFn: async () => {
      console.log(`🔍 Fetching streaming availability for ${titleName} in ${region}`);
      
      const { data, error } = await supabase.functions.invoke('check-streaming-availability', {
        body: {
          titleId,
          titleName,
          region
        }
      });

      if (error) {
        console.error('Streaming availability error:', error);
        throw new Error(error.message || 'Failed to check streaming availability');
      }

      return data;
    },
    enabled: enabled && !!titleId && !!titleName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry rate limit errors
      if (error?.message?.includes('Rate limit exceeded')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};