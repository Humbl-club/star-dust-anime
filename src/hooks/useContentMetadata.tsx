import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentMetadata {
  genres: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    relevance: number;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    rank: number;
    votes: number;
    is_spoiler: boolean;
  }>;
  studios: Array<{
    id: string;
    name: string;
    slug: string;
    is_main: boolean;
    role: string;
  }>;
  creators: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    is_main: boolean;
  }>;
  characters: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    order: number;
    voice_actors: Array<{
      id: string;
      name: string;
      language: string;
    }>;
  }>;
}

export const useContentMetadata = (titleId: string) => {
  return useQuery({
    queryKey: ['content-metadata', titleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_title_metadata', { title_id_param: titleId });

      if (error) throw error;
      
      // Handle the case where data might be null or in unexpected format
      if (!data || typeof data !== 'object') {
        return {
          genres: [],
          tags: [],
          studios: [],
          creators: [],
          characters: []
        } as ContentMetadata;
      }
      
      return data as unknown as ContentMetadata;
    },
    enabled: !!titleId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};