import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrailerResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  type: 'official' | 'review' | 'explanation';
  youtuber?: string;
}

interface SmartTrailerSearchResult {
  success: boolean;
  animeTitle: string;
  results: TrailerResult[];
  totalFound: number;
  breakdown: {
    official: number;
    review: number;
    explanation: number;
  };
}

interface UseSmartTrailerSearchOptions {
  animeTitle?: string;
  autoSearch?: boolean;
  maxResults?: number;
}

export const useSmartTrailerSearch = (options: UseSmartTrailerSearchOptions = {}) => {
  const { animeTitle, autoSearch = false, maxResults = 6 } = options;
  
  const [trailers, setTrailers] = useState<TrailerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SmartTrailerSearchResult | null>(null);

  const searchTrailers = useCallback(async (title: string) => {
    if (!title?.trim()) {
      setError('Anime title is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Starting smart search for: ${title}`);
      
      const { data, error: functionError } = await supabase.functions.invoke('smart-trailer-search', {
        body: { 
          animeTitle: title, 
          maxResults 
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to search trailers');
      }

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      console.log(`✅ Found ${data.results.length} trailers:`, data.breakdown);
      
      setTrailers(data.results);
      setSearchResult(data);
      
      // Show summary toast
      const { official, review, explanation } = data.breakdown;
      const summaryParts = [];
      if (official > 0) summaryParts.push(`${official} official trailer${official > 1 ? 's' : ''}`);
      if (review > 0) summaryParts.push(`${review} review${review > 1 ? 's' : ''}`);
      if (explanation > 0) summaryParts.push(`${explanation} explanation${explanation > 1 ? 's' : ''}`);
      
      if (summaryParts.length > 0) {
        toast.success(`Found ${summaryParts.join(', ')}`);
      } else {
        toast.info('No trailers found for this anime');
      }
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search trailers';
      console.error('Smart trailer search error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      setTrailers([]);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  }, [maxResults]);

  const refreshSearch = useCallback(() => {
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

  const getTrailersByType = useCallback((type: 'official' | 'review' | 'explanation') => {
    return trailers.filter(trailer => trailer.type === type);
  }, [trailers]);

  const getBestTrailer = useCallback(() => {
    // Prioritize official trailers, then reviews, then explanations
    const official = trailers.find(t => t.type === 'official');
    if (official) return official;
    
    const review = trailers.find(t => t.type === 'review');
    if (review) return review;
    
    return trailers[0] || null;
  }, [trailers]);

  return {
    trailers,
    loading,
    error,
    searchResult,
    searchTrailers,
    refreshSearch,
    getTrailersByType,
    getBestTrailer,
    // Summary data
    hasOfficialTrailer: trailers.some(t => t.type === 'official'),
    hasReviews: trailers.some(t => t.type === 'review'),
    hasExplanations: trailers.some(t => t.type === 'explanation'),
    totalResults: trailers.length
  };
};