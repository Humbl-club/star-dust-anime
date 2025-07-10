import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { set, get } from 'idb-keyval';

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  glassmorphism: boolean;
  animations: boolean;
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface BehaviorSettings {
  autoSync: boolean;
  autoAddSequels: boolean;
  showAdultContent: boolean;
  defaultListStatus: string;
  notificationsEnabled: boolean;
  soundEffects: boolean;
  defaultView: 'grid' | 'list';
  itemsPerPage: number;
}

export interface PrivacySettings {
  listVisibility: 'public' | 'private' | 'friends';
  showProgress: boolean;
  showRatings: boolean;
  activityVisible: boolean;
  profileVisible: boolean;
}

export interface AdvancedSettings {
  debugMode: boolean;
  experimentalFeatures: boolean;
  cacheSize: number;
  syncInterval: number;
  virtualScrolling: boolean;
  preloadImages: boolean;
}

export interface UserSettings {
  appearance: AppearanceSettings;
  behavior: BehaviorSettings;
  privacy: PrivacySettings;
  advanced: AdvancedSettings;
}

const defaultSettings: UserSettings = {
  appearance: {
    theme: 'system',
    primaryColor: '#3B82F6',
    accentColor: '#EF4444',
    glassmorphism: true,
    animations: true,
    compactMode: false,
    fontSize: 'medium',
  },
  behavior: {
    autoSync: true,
    autoAddSequels: true,
    showAdultContent: false,
    defaultListStatus: 'plan_to_watch',
    notificationsEnabled: true,
    soundEffects: true,
    defaultView: 'grid',
    itemsPerPage: 20,
  },
  privacy: {
    listVisibility: 'public',
    showProgress: true,
    showRatings: true,
    activityVisible: true,
    profileVisible: true,
  },
  advanced: {
    debugMode: false,
    experimentalFeatures: false,
    cacheSize: 100,
    syncInterval: 30,
    virtualScrolling: false,
    preloadImages: true,
  },
};

interface SettingsStore {
  settings: UserSettings;
  isLoading: boolean;
  hasChanges: boolean;
  
  // Actions
  updateAppearance: (updates: Partial<AppearanceSettings>) => void;
  updateBehavior: (updates: Partial<BehaviorSettings>) => void;
  updatePrivacy: (updates: Partial<PrivacySettings>) => void;
  updateAdvanced: (updates: Partial<AdvancedSettings>) => void;
  resetSettings: () => void;
  resetCategory: (category: keyof UserSettings) => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
  saveToSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
  markSaved: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoading: false,
      hasChanges: false,

      updateAppearance: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: { ...state.settings.appearance, ...updates },
          },
          hasChanges: true,
        })),

      updateBehavior: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            behavior: { ...state.settings.behavior, ...updates },
          },
          hasChanges: true,
        })),

      updatePrivacy: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            privacy: { ...state.settings.privacy, ...updates },
          },
          hasChanges: true,
        })),

      updateAdvanced: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            advanced: { ...state.settings.advanced, ...updates },
          },
          hasChanges: true,
        })),

      resetSettings: () =>
        set({
          settings: defaultSettings,
          hasChanges: true,
        }),

      resetCategory: (category) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [category]: defaultSettings[category],
          },
          hasChanges: true,
        })),

      exportSettings: () => {
        const { settings } = get();
        return JSON.stringify(settings, null, 2);
      },

      importSettings: (settingsJson) => {
        try {
          const imported = JSON.parse(settingsJson);
          set({
            settings: { ...defaultSettings, ...imported },
            hasChanges: true,
          });
          return true;
        } catch {
          return false;
        }
      },

      saveToSupabase: async () => {
        // This would integrate with Supabase to save user settings
        const { settings } = get();
        try {
          set({ isLoading: true });
          // TODO: Implement Supabase save
          await set({ markSaved: () => set({ hasChanges: false }) });
        } finally {
          set({ isLoading: false });
        }
      },

      loadFromSupabase: async () => {
        try {
          set({ isLoading: true });
          // TODO: Implement Supabase load
        } finally {
          set({ isLoading: false });
        }
      },

      markSaved: () => set({ hasChanges: false }),
    }),
    {
      name: 'anithing-settings',
      storage: {
        getItem: async (name) => {
          const value = await get(name);
          return value || null;
        },
        setItem: async (name, value) => {
          await set(name, value);
        },
        removeItem: async (name) => {
          // idb-keyval doesn't have a direct remove, but we can set to undefined
          await set(name, undefined);
        },
      },
    }
  )
);