import { useState, useEffect } from 'react';

export const useNamePreference = () => {
  const [showEnglish, setShowEnglish] = useState(() => {
    const saved = localStorage.getItem('anime-name-preference');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('anime-name-preference', JSON.stringify(showEnglish));
  }, [showEnglish]);

  const getDisplayName = (anime: { title: string; title_english?: string | null }) => {
    if (showEnglish && anime.title_english) {
      return anime.title_english;
    }
    return anime.title;
  };

  return {
    showEnglish,
    setShowEnglish,
    getDisplayName
  };
};