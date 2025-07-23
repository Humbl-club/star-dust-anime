import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'anithing_search_history';
const MAX_HISTORY_ITEMS = 5;

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  // Add search to history
  const addToHistory = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) return;

    setSearchHistory(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.toLowerCase() !== trimmedQuery.toLowerCase());
      // Add to beginning
      const newHistory = [trimmedQuery, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      // Save to localStorage
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  // Remove specific item from history
  const removeFromHistory = (query: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item !== query);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  return {
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory
  };
};