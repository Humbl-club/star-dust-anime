import { useUserPreferencesStore } from '@/store';

export const useNamePreference = () => {
  const { namePreference, setNamePreference } = useUserPreferencesStore();
  
  // Convert from old boolean to new enum system
  const showEnglish = namePreference === 'english';
  
  const setShowEnglish = (show: boolean) => {
    setNamePreference(show ? 'english' : 'romaji');
  };

  const getDisplayName = (anime: { title: string; title_english?: string | null }) => {
    if (showEnglish && anime.title_english) {
      return anime.title_english;
    }
    return anime.title;
  };

  return {
    showEnglish,
    setShowEnglish,
    getDisplayName,
    // New enhanced functionality
    namePreference,
    setNamePreference
  };
};