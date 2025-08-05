import { create } from 'zustand';

interface InitializationState {
  isInitialized: boolean;
  setIsInitialized: (initialized: boolean) => void;
}

export const useInitializationStore = create<InitializationState>((set) => ({
  isInitialized: false,
  setIsInitialized: (initialized: boolean) => set({ isInitialized: initialized }),
}));