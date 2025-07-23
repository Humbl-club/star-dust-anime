import { create } from 'zustand';

interface UIStore {
  navigation: {
    isMobileMenuOpen: boolean;
  };
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  navigation: {
    isMobileMenuOpen: false,
  },
  setMobileMenuOpen: (open: boolean) =>
    set((state) => ({
      navigation: { ...state.navigation, isMobileMenuOpen: open }
    })),
}));