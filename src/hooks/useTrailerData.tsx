import { useState, useEffect, useCallback } from 'react';
import { youtubeService, YouTubeSearchResult, YouTubeVideoDetails } from '@/services/youtube';
import { toast } from 'sonner';

interface UseTrailerDataOptions {
  animeTitle?: string;
  autoSearch?: boolean;
  maxResults?: number;
}

export const useTrailerData = (options: UseTrailerDataOptions = {}) => {
  const { animeTitle, autoSearch = false, maxResults = 5 } = options;
  
  const [trailers, setTrailers] = useState<YouTubeSearchResult[]>([]);
  const [selectedTrailer, setSelectedTrailer] = useState<YouTubeVideoDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTrailers = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await youtubeService.searchTrailers(query, maxResults);
      setTrailers(results);
      
      // Auto-select the first trailer if available
      if (results.length > 0 && !selectedTrailer) {
        const firstTrailer = results[0];
        const details = await youtubeService.getVideoDetails(firstTrailer.id.videoId);
        if (details) {
          setSelectedTrailer(details);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search trailers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [maxResults, selectedTrailer]);

  const selectTrailer = useCallback(async (videoId: string) => {
    if (!youtubeService.isValidVideoId(videoId)) {
      toast.error('Invalid video ID');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const details = await youtubeService.getVideoDetails(videoId);
      if (details) {
        setSelectedTrailer(details);
        toast.success('Trailer selected');
      } else {
        throw new Error('Failed to get video details');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to select trailer';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTrailer(null);
  }, []);

  const refreshTrailers = useCallback(() => {
    if (animeTitle) {
      searchTrailers(animeTitle);
    }
  }, [animeTitle, searchTrailers]);

  // Auto-search on mount if enabled
  useEffect(() => {
    if (autoSearch && animeTitle) {
      searchTrailers(animeTitle);
    }
  }, [autoSearch, animeTitle, searchTrailers]);

  return {
    trailers,
    selectedTrailer,
    loading,
    error,
    searchTrailers,
    selectTrailer,
    clearSelection,
    refreshTrailers,
    // Utility functions
    getEmbedUrl: (videoId: string) => youtubeService.getEmbedUrl(videoId),
    getThumbnail: (videoId: string, quality?: 'maxres' | 'high' | 'medium') => 
      youtubeService.getThumbnail(videoId, quality),
    extractVideoId: (url: string) => youtubeService.extractVideoId(url),
  };
};