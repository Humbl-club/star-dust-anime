import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface SearchCache {
  [key: string]: {
    results: any[];
    timestamp: number;
    aiSuggestion?: any;
  };
}

interface UserSearchLimits {
  aiSearchCount: number;
  lastReset: string;
}

export const useEnhancedSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchInfo, setSearchInfo] = useState<any>(null);
  const { user } = useAuth();
  
  const cacheRef = useRef<SearchCache>({});
  const userLimitsRef = useRef<UserSearchLimits>({ aiSearchCount: 0, lastReset: new Date().toDateString() });

  // Check if user has exceeded AI search limits
  const checkRateLimit = useCallback(() => {
    const today = new Date().toDateString();
    const limits = userLimitsRef.current;
    
    if (limits.lastReset !== today) {
      limits.aiSearchCount = 0;
      limits.lastReset = today;
    }
    
    return limits.aiSearchCount < 10; // Max 10 AI searches per day
  }, []);

  // Enhanced database search with fuzzy matching
  const performDatabaseSearch = useCallback(async (query: string, contentType: 'anime' | 'manga' = 'anime') => {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    // Try exact matches first
    const { data: exactResults } = await supabase
      .from(contentType)
      .select('*')
      .or(`title.ilike.%${query}%,title_english.ilike.%${query}%,title_japanese.ilike.%${query}%`)
      .limit(20);

    if (exactResults && exactResults.length >= 5) {
      return exactResults;
    }

    // Try fuzzy matching with individual terms
    const fuzzyQueries = searchTerms.map(term => 
      `title.ilike.%${term}%,title_english.ilike.%${term}%,title_japanese.ilike.%${term}%,synopsis.ilike.%${term}%`
    );

    const { data: fuzzyResults } = await supabase
      .from(contentType)
      .select('*')
      .or(fuzzyQueries.join(','))
      .limit(20);

    return [...(exactResults || []), ...(fuzzyResults || [])].filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
  }, []);

  const enhancedSearch = useCallback(async (query: string, contentType: 'anime' | 'manga' = 'anime') => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setSearchInfo(null);
      return [];
    }

    const cacheKey = `${query.toLowerCase()}-${contentType}`;
    const cached = cacheRef.current[cacheKey];
    
    // Check cache (24h expiry)
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      setSearchResults(cached.results);
      setSearchInfo({ searchType: 'cached', originalQuery: query });
      return cached.results;
    }

    setIsSearching(true);

    try {
      // Primary search: Enhanced database queries
      const dbResults = await performDatabaseSearch(query, contentType);
      
      // If we have good results, return them
      if (dbResults.length >= 3) {
        const searchInfo = { searchType: 'database', originalQuery: query, resultCount: dbResults.length };
        
        // Cache the results
        cacheRef.current[cacheKey] = {
          results: dbResults,
          timestamp: Date.now()
        };
        
        setSearchResults(dbResults);
        setSearchInfo(searchInfo);
        return dbResults;
      }

      // Only use AI for zero/low result scenarios and if under rate limit
      if (dbResults.length < 3 && user && checkRateLimit()) {
        userLimitsRef.current.aiSearchCount++;
        
        const { data, error } = await supabase.functions.invoke('ai-search', {
          body: { query: query.trim(), contentType, limit: 15 }
        });

        if (!error && data?.results) {
          const aiInfo = {
            searchType: 'ai-enhanced',
            originalQuery: query,
            aiSuggestion: data.aiSuggestion,
            resultCount: data.results.length
          };

          // Cache AI results
          cacheRef.current[cacheKey] = {
            results: data.results,
            timestamp: Date.now(),
            aiSuggestion: data.aiSuggestion
          };

          setSearchResults(data.results);
          setSearchInfo(aiInfo);
          
          if (data.aiSuggestion?.correctedQuery !== query) {
            toast.success(`AI found results for: "${data.aiSuggestion?.correctedQuery}"`);
          }
          
          return data.results;
        }
      } else if (!checkRateLimit()) {
        toast.info('Daily AI search limit reached. Showing database results.');
      }

      // Fallback to database results
      setSearchResults(dbResults);
      setSearchInfo({ searchType: 'database', originalQuery: query, resultCount: dbResults.length });
      return dbResults;

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [user, checkRateLimit, performDatabaseSearch]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchInfo(null);
  }, []);

  return {
    enhancedSearch,
    isSearching,
    searchResults,
    searchInfo,
    clearSearch,
    remainingAISearches: Math.max(0, 10 - userLimitsRef.current.aiSearchCount)
  };
};