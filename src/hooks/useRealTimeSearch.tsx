import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  title: string;
  title_english?: string;
  title_japanese?: string;
  image_url?: string;
  score?: number;
  type?: string;
  popularity?: number;
}

export const useRealTimeSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    console.log('Performing search for:', searchQuery);

    try {
      const { data: results, error } = await supabase
        .from('titles')
        .select(`
          id, 
          title, 
          title_english, 
          title_japanese, 
          image_url, 
          score, 
          popularity,
          anime_details!inner(type)
        `)
        .or(`title.ilike.%${searchQuery}%,title_english.ilike.%${searchQuery}%,title_japanese.ilike.%${searchQuery}%`)
        .order('popularity', { ascending: false })
        .limit(8);

      console.log('Search results:', results);

      if (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        return;
      }

      // Flatten the results to match expected interface
      const flattenedResults = (results || []).map(result => ({
        ...result,
        type: (result.anime_details as any)?.type || 'TV'
      }));

      setSearchResults(flattenedResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = (searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      debouncedSearch(value);
    } else {
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  return {
    query,
    isSearching,
    searchResults,
    handleInputChange,
    clearSearch,
    performSearch
  };
};