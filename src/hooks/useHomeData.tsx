import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HomeDataRequest {
  sections: string[];
  limit?: number;
}

interface HomeDataResponse {
  success: boolean;
  data: {
    trendingAnime?: any[];
    trendingManga?: any[];
    recentAnime?: any[];
    recentManga?: any[];
  };
  cached_at: string;
}

export const useHomeData = (sections: string[], limit = 20) => {
  return useQuery({
    queryKey: ['home-data', sections, limit],
    queryFn: async (): Promise<HomeDataResponse> => {
      console.log('🏠 Fetching home data via Edge Function:', sections);
      
      const { data, error } = await supabase.functions.invoke('get-home-data', {
        body: {
          sections,
          limit
        }
      });

      if (error) {
        console.error('❌ Home data Edge Function error:', error);
        throw new Error(`Home data fetch failed: ${error.message}`);
      }

      console.log('✅ Home data received:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};