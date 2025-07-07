import { useState, useRef } from 'react';
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

export const useSimpleSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    console.log('🔍 Searching for:', searchQuery);

    try {
      // Direct database search with proper ILIKE queries using normalized tables
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
        .or(`title.ilike.%${searchQuery.trim()}%,title_english.ilike.%${searchQuery.trim()}%,title_japanese.ilike.%${searchQuery.trim()}%`)
        .order('popularity', { ascending: false })
        .limit(10);

      console.log('🔍 Search results found:', results?.length || 0);

      if (error) {
        console.error('❌ Search error:', error);
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
      console.error('❌ Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Immediate search for better UX
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 200); // Faster debounce
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setIsSearching(false);
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