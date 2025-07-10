import { useMemo } from 'react';
import Fuse from 'fuse.js';

interface SearchableItem {
  id: string;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis?: string;
  genres?: string[];
  type?: string;
  year?: number;
  [key: string]: any;
}

export const useAdvancedSearch = <T extends SearchableItem>(
  items: T[],
  searchQuery: string,
  options?: {
    threshold?: number;
    includeScore?: boolean;
    keys?: string[];
  }
) => {
  const fuse = useMemo(() => {
    const defaultKeys = [
      'title',
      'title_english', 
      'title_japanese',
      'synopsis',
      'type'
    ];
    
    return new Fuse(items, {
      keys: options?.keys || defaultKeys,
      threshold: options?.threshold || 0.3,
      includeScore: options?.includeScore || false,
      ignoreLocation: true,
      findAllMatches: true,
    });
  }, [items, options]);

  const results = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const fuseResults = fuse.search(searchQuery);
    return fuseResults.map(result => result.item);
  }, [fuse, searchQuery, items]);

  return results;
};