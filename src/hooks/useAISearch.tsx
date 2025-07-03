import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISearchResult {
  results: any[];
  searchType: 'direct' | 'ai-enhanced' | 'fallback';
  originalQuery: string;
  aiSuggestion?: {
    correctedQuery: string;
    alternativeTerms: string[];
    searchStrategy: string;
    genres?: string[];
  };
  searchTermsUsed?: string[];
}

export const useAISearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [lastSearchInfo, setLastSearchInfo] = useState<AISearchResult | null>(null);

  const aiSearch = async (query: string, contentType: 'anime' | 'manga' = 'anime', limit = 20) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setLastSearchInfo(null);
      return [];
    }

    setIsSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: {
          query: query.trim(),
          contentType,
          limit
        }
      });

      if (error) {
        console.error('AI search error:', error);
        toast.error('Search failed. Please try again.');
        return [];
      }

      const results = data.results || [];
      setSearchResults(results);
      setLastSearchInfo(data);

      // Show user-friendly feedback
      if (data.searchType === 'ai-enhanced' && data.aiSuggestion) {
        const { correctedQuery, searchStrategy } = data.aiSuggestion;
        
        if (correctedQuery !== query) {
          toast.success(`Found results for "${correctedQuery}" - ${searchStrategy}`);
        } else if (searchStrategy) {
          toast.success(`AI Search: ${searchStrategy}`);
        }
      }

      return results;
      
    } catch (error) {
      console.error('AI search error:', error);
      toast.error('Search failed. Please try again.');
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setLastSearchInfo(null);
  };

  return {
    aiSearch,
    isSearching,
    searchResults,
    lastSearchInfo,
    clearSearch
  };
};