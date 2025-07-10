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
  anilist_id?: number;
  contentType?: 'anime' | 'manga';
}

export const useConsolidatedSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  const performSearch = async (searchQuery: string, contentType: 'anime' | 'manga' | 'both' = 'both') => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    console.log('🔍 Searching for:', searchQuery, 'Type:', contentType);

    try {
      // Build query based on content type
      let query = supabase
        .from('titles')
        .select(`
          id, 
          title, 
          title_english, 
          title_japanese, 
          image_url, 
          score, 
          popularity,
          anilist_id,
          anime_details(type, status, episodes),
          manga_details(type, status, chapters)
        `)
        .or(`title.ilike.%${searchQuery.trim()}%,title_english.ilike.%${searchQuery.trim()}%,title_japanese.ilike.%${searchQuery.trim()}%`)
        .order('popularity', { ascending: false })
        .limit(12);

      // Filter by content type if specified
      if (contentType === 'anime') {
        query = query.not('anime_details', 'is', null);
      } else if (contentType === 'manga') {
        query = query.not('manga_details', 'is', null);
      }

      const { data: results, error } = await query;

      console.log('🔍 Search results found:', results?.length || 0);

      if (error) {
        console.error('❌ Search error:', error);
        setSearchResults([]);
        return;
      }

      // Process results with proper type detection
      const processedResults = (results || []).map(result => {
        const isAnime = result.anime_details && Array.isArray(result.anime_details) ? result.anime_details.length > 0 : !!result.anime_details;
        const isManga = result.manga_details && Array.isArray(result.manga_details) ? result.manga_details.length > 0 : !!result.manga_details;
        
        let type = 'Unknown';
        if (isAnime && result.anime_details) {
          const animeDetails = Array.isArray(result.anime_details) ? result.anime_details[0] : result.anime_details;
          type = animeDetails.type || 'TV';
        } else if (isManga && result.manga_details) {
          const mangaDetails = Array.isArray(result.manga_details) ? result.manga_details[0] : result.manga_details;
          type = mangaDetails.type || 'Manga';
        }

        return {
          id: result.id,
          title: result.title,
          title_english: result.title_english,
          title_japanese: result.title_japanese,
          image_url: result.image_url,
          score: result.score,
          popularity: result.popularity,
          anilist_id: result.anilist_id,
          type,
          contentType: isAnime ? 'anime' : 'manga'
        } as SearchResult;
      });

      setSearchResults(processedResults);
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

    // Debounced search
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
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