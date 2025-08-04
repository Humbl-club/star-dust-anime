import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SimilarContentResult {
  id: string;
  title: string;
  title_english?: string;
  title_japanese?: string;
  image_url: string;
  score: number;
  anilist_id: number;
  match_reason: string;
  confidence_score: number;
  relation_type?: string;
  genres?: any[];
  studios?: any[];
  authors?: any[];
}

interface SmartSimilarContentResult {
  success: boolean;
  results: SimilarContentResult[];
  total: number;
  cache_duration: number;
}

interface UseSmartSimilarContentOptions {
  titleId?: string;
  contentType?: 'anime' | 'manga';
  limit?: number;
  autoLoad?: boolean;
}

const CACHE_KEY_PREFIX = 'smart_similar_content_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Cache management
const getCachedResults = (titleId: string, contentType: string): SimilarContentResult[] | null => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${contentType}_${titleId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading similar content cache:', error);
    return null;
  }
};

const setCachedResults = (titleId: string, contentType: string, results: SimilarContentResult[]): void => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${contentType}_${titleId}`;
    const cacheData = {
      data: results,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing similar content cache:', error);
  }
};

export const useSmartSimilarContent = (options: UseSmartSimilarContentOptions = {}) => {
  const { titleId, contentType, limit = 12, autoLoad = true } = options;
  
  const [results, setResults] = useState<SimilarContentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedResults, setCachedResultsState] = useState<SimilarContentResult[] | null>(null);

  // Check cache first
  useEffect(() => {
    if (titleId && contentType) {
      const cached = getCachedResults(titleId, contentType);
      if (cached && cached.length > 0) {
        setCachedResultsState(cached);
        setResults(cached);
      }
    }
  }, [titleId, contentType]);

  const fetchSimilarContent = useCallback(async (id: string, type: 'anime' | 'manga') => {
    if (!id || !type) {
      setError('Title ID and content type are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Fetching similar ${type} for: ${id}`);
      
      const { data, error: functionError } = await supabase.functions.invoke('smart-similar-content', {
        body: { 
          titleId: id, 
          contentType: type,
          limit 
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to fetch similar content');
      }

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      console.log(`✅ Found ${data.results.length} similar titles`);
      
      setResults(data.results);
      setCachedResults(id, type, data.results);
      
      // Show summary toast
      const confidenceRange = data.results.length > 0 
        ? `${Math.min(...data.results.map((r: any) => r.confidence_score))}%-${Math.max(...data.results.map((r: any) => r.confidence_score))}%`
        : '0%';
      
      toast.success(`Found ${data.results.length} similar titles (confidence: ${confidenceRange})`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch similar content';
      console.error('Smart similar content error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refreshContent = useCallback(() => {
    if (titleId && contentType) {
      fetchSimilarContent(titleId, contentType);
    }
  }, [titleId, contentType, fetchSimilarContent]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && titleId && contentType && !cachedResults) {
      fetchSimilarContent(titleId, contentType);
    }
  }, [autoLoad, titleId, contentType, cachedResults, fetchSimilarContent]);

  const getResultsByType = useCallback((type: 'recommendation' | 'relation' | 'collaborative' | 'genre') => {
    const typeMap = {
      recommendation: 'AniList Recommendation',
      relation: ['Sequel', 'Prequel', 'Alternative', 'Side story', 'Parent', 'Adaptation'],
      collaborative: 'Liked by',
      genre: 'shared genre'
    };
    
    if (type === 'relation') {
      return results.filter(r => typeMap.relation.some(relType => r.match_reason.includes(relType)));
    }
    
    return results.filter(r => r.match_reason.includes(typeMap[type]));
  }, [results]);

  const getHighestConfidence = useCallback(() => {
    return results.length > 0 ? Math.max(...results.map(r => r.confidence_score)) : 0;
  }, [results]);

  const getAverageConfidence = useCallback(() => {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((sum, r) => sum + r.confidence_score, 0) / results.length);
  }, [results]);

  return {
    results,
    loading,
    error,
    fetchSimilarContent,
    refreshContent,
    getResultsByType,
    getHighestConfidence,
    getAverageConfidence,
    // Summary data
    hasRecommendations: results.some(r => r.match_reason === 'AniList Recommendation'),
    hasRelations: results.some(r => r.relation_type),
    hasCollaborative: results.some(r => r.match_reason.includes('Liked by')),
    totalResults: results.length,
    cached: !!cachedResults
  };
};