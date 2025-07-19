import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';

interface FillerEpisode {
  episode: number;
  title?: string;
  filler: boolean;
  mixed_canon_filler?: boolean;
}

interface FillerAnimeData {
  anime_id: number;
  anime_title: string;
  episodes: FillerEpisode[];
}

interface UseFillerDataReturn {
  fillerData: FillerEpisode[] | null;
  isLoading: boolean;
  error: string | null;
  getMainStoryProgress: (currentEpisode: number) => {
    mainStoryEpisodes: number;
    totalEpisodes: number;
    mainStoryProgress: number;
  };
  isFillerEpisode: (episode: number) => boolean;
  getNextMainStoryEpisode: (currentEpisode: number) => number | null;
}

export function useFillerData(animeTitle?: string, malId?: number): UseFillerDataReturn {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create search query from anime title
  useEffect(() => {
    if (animeTitle) {
      // Clean up the title for better search results
      const cleanTitle = animeTitle
        .replace(/[^\w\s]/g, ' ') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .toLowerCase();
      setSearchQuery(cleanTitle);
    }
  }, [animeTitle]);

  const { data: fillerData, isLoading, error } = useQuery({
    queryKey: queryKeys.filler.byTitle(searchQuery || ''),
    queryFn: async (): Promise<FillerEpisode[] | null> => {
      if (!searchQuery) return null;

      try {
        // Search for anime by title
        const searchResponse = await fetch(
          `https://www.animefillerlist.com/api/v1/anime/search?title=${encodeURIComponent(searchQuery)}`
        );

        if (!searchResponse.ok) {
          throw new Error('Failed to search anime');
        }

        const searchData = await searchResponse.json();
        
        // If no results found, try a more lenient search
        if (!searchData.results || searchData.results.length === 0) {
          const words = searchQuery.split(' ');
          const firstWord = words[0];
          
          const fallbackResponse = await fetch(
            `https://www.animefillerlist.com/api/v1/anime/search?title=${encodeURIComponent(firstWord)}`
          );
          
          if (!fallbackResponse.ok) {
            return null;
          }
          
          const fallbackData = await fallbackResponse.json();
          if (!fallbackData.results || fallbackData.results.length === 0) {
            return null;
          }
        }

        const results = searchData.results || [];
        
        // Find the best match
        let bestMatch = results[0];
        
        // If we have a MAL ID, try to find exact match
        if (malId) {
          const malMatch = results.find((anime: any) => anime.mal_id === malId);
          if (malMatch) {
            bestMatch = malMatch;
          }
        }

        if (!bestMatch) {
          return null;
        }

        // Fetch detailed filler data
        const detailResponse = await fetch(
          `https://www.animefillerlist.com/api/v1/anime/${bestMatch.anime_id}`
        );

        if (!detailResponse.ok) {
          throw new Error('Failed to fetch filler details');
        }

        const detailData: FillerAnimeData = await detailResponse.json();
        return detailData.episodes || [];

      } catch (error) {
        console.warn('Filler data fetch failed:', error);
        return null;
      }
    },
    enabled: !!searchQuery,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (renamed from cacheTime)
    retry: 1,
  });

  const getMainStoryProgress = (currentEpisode: number) => {
    if (!fillerData) {
      return {
        mainStoryEpisodes: currentEpisode,
        totalEpisodes: currentEpisode,
        mainStoryProgress: currentEpisode,
      };
    }

    const mainStoryEpisodes = fillerData
      .filter(ep => ep.episode <= currentEpisode && !ep.filler)
      .length;

    const totalMainStoryEpisodes = fillerData.filter(ep => !ep.filler).length;

    return {
      mainStoryEpisodes,
      totalEpisodes: currentEpisode,
      mainStoryProgress: mainStoryEpisodes,
    };
  };

  const isFillerEpisode = (episode: number): boolean => {
    if (!fillerData) return false;
    const episodeData = fillerData.find(ep => ep.episode === episode);
    return episodeData?.filler || false;
  };

  const getNextMainStoryEpisode = (currentEpisode: number): number | null => {
    if (!fillerData) return null;
    
    const nextMainStory = fillerData.find(
      ep => ep.episode > currentEpisode && !ep.filler
    );
    
    return nextMainStory?.episode || null;
  };

  return {
    fillerData,
    isLoading,
    error: error?.message || null,
    getMainStoryProgress,
    isFillerEpisode,
    getNextMainStoryEpisode,
  };
}