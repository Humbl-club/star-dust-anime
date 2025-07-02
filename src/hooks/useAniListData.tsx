import { useState, useEffect } from 'react';
import { anilistService } from '@/services/anilist';
import { AniListAnime } from '@/types/anilist';
import { toast } from 'sonner';

interface UseAniListDataOptions {
  autoFetch?: boolean;
  malId?: number;
  anilistId?: number;
}

export const useAniListData = (options: UseAniListDataOptions = {}) => {
  const [data, setData] = useState<AniListAnime | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoFetch = true, malId, anilistId } = options;

  const fetchData = async () => {
    if (!malId && !anilistId) return;

    setLoading(true);
    setError(null);

    try {
      let result: AniListAnime | null = null;
      
      if (anilistId) {
        const response = await anilistService.getAnimeDetails(anilistId);
        result = response.data.Media;
      } else if (malId) {
        result = await anilistService.getAnimeByMalId(malId);
      }

      setData(result);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch AniList data';
      setError(errorMessage);
      console.error('Error fetching AniList data:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchAnime = async (searchOptions: {
    search?: string;
    page?: number;
    perPage?: number;
    genre?: string;
    status?: string;
    sort?: string[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await anilistService.searchAnime(searchOptions);
      return response.data.Page.media;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search anime';
      setError(errorMessage);
      toast.error('Failed to search anime on AniList');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getEnhancedData = (malAnime: any): any => {
    if (!data) return malAnime;

    // Merge MAL data with AniList enhancements
    return {
      ...malAnime,
      // Use high-quality AniList images
      image_url: anilistService.getBestImage(data),
      banner_image: data.bannerImage,
      // Enhanced metadata
      anilist_score: data.averageScore ? data.averageScore / 10 : null,
      color_theme: data.coverImage.color,
      // Additional AniList-specific data
      characters: data.characters?.edges || [],
      staff: data.staff?.edges || [],
      relations: data.relations?.edges || [],
      recommendations: data.recommendations?.nodes || [],
      external_links: data.externalLinks || [],
      streaming_episodes: data.streamingEpisodes || [],
      detailed_tags: data.tags || [],
      trailer: data.trailer,
    };
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [malId, anilistId, autoFetch]);

  return {
    data,
    loading,
    error,
    fetchData,
    searchAnime,
    getEnhancedData,
    // Utility functions
    getBestImage: (anime: AniListAnime) => anilistService.getBestImage(anime),
    getTitle: (anime: AniListAnime, preferEnglish?: boolean) => anilistService.getTitle(anime, preferEnglish),
  };
};