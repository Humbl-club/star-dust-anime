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
      const [genresResult, studiosResult, authorsResult] = await Promise.all([
        // Get genres for this title
        supabase
          .from('title_genres')
          .select(`
            genres!inner(id, name, slug, type)
          `)
          .eq('title_id', titleId),
        
        // Get studios for anime titles
        supabase
          .from('title_studios')
          .select(`
            studios!inner(id, name, slug)
          `)
          .eq('title_id', titleId),
          
        // Get authors for manga titles
        supabase
          .from('title_authors')
          .select(`
            authors!inner(id, name, slug)
          `)
          .eq('title_id', titleId)
      ]);

      const metadata: ContentMetadata = {
        genres: genresResult.data?.map(item => ({
          id: item.genres.id,
          name: item.genres.name,
          slug: item.genres.slug || '',
          category: item.genres.type || 'genre',
          relevance: 1
        })) || [],
        tags: [], // Tags would require additional database structure
        studios: studiosResult.data?.map(item => ({
          id: item.studios.id,
          name: item.studios.name,
          slug: item.studios.slug || '',
          is_main: true,
          role: 'animation'
        })) || [],
        creators: authorsResult.data?.map(item => ({
          id: item.authors.id,
          name: item.authors.name,
          slug: item.authors.slug || '',
          role: 'author',
          is_main: true
        })) || [],
        characters: []
      };

      return metadata;
    },
    enabled: !!titleId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};