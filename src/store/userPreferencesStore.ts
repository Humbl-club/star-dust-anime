import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NamePreference = 'romaji' | 'english' | 'japanese';
export type Theme = 'light' | 'dark' | 'system';

interface UserPreferencesState {
  // Name preference for anime/manga titles
  namePreference: NamePreference;
  setNamePreference: (preference: NamePreference) => void;
  
  // Theme preference
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Content filters
  showAdultContent: boolean;
  setShowAdultContent: (show: boolean) => void;
  
  // Language preference
  language: string;
  setLanguage: (language: string) => void;
  
  // Auto-play settings
  autoPlay: boolean;
  setAutoPlay: (autoPlay: boolean) => void;
  
  // Age verification
  ageVerified: boolean;
  setAgeVerified: (verified: boolean) => void;
  ageVerificationDate: Date | null;
  setAgeVerificationDate: (date: Date | null) => void;
  
  // Reset all preferences
  resetPreferences: () => void;
}

const defaultState = {
  namePreference: 'romaji' as NamePreference,
  theme: 'system' as Theme,
  showAdultContent: false,
  language: 'en',
  autoPlay: true,
  ageVerified: false,
  ageVerificationDate: null,
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      
      setNamePreference: (preference) => 
        set({ namePreference: preference }),
      
      setTheme: (theme) => 
        set({ theme }),
      
      setShowAdultContent: (show) => 
        set({ showAdultContent: show }),
      
      setLanguage: (language) => 
        set({ language }),
      
      setAutoPlay: (autoPlay) => 
        set({ autoPlay }),
      
      setAgeVerified: (verified) => 
        set({ 
          ageVerified: verified,
          ageVerificationDate: verified ? new Date() : null
        }),
      
      setAgeVerificationDate: (date) => 
        set({ ageVerificationDate: date }),
      
      resetPreferences: () => 
        set(defaultState),
    }),
    {
      name: 'user-preferences',
      version: 1,
    }
  )
);