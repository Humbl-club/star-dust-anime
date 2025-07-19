import { create } from 'zustand';

interface UIState {
  // Modal states
  modals: {
    ageVerification: boolean;
    emailVerification: boolean;
    login: boolean;
    settings: boolean;
    addToList: boolean;
    imageViewer: boolean;
    shareModal: boolean;
    filterModal: boolean;
  };
  setModal: (modal: keyof UIState['modals'], open: boolean) => void;
  closeAllModals: () => void;
  
  // Sidebar states
  sidebar: {
    isOpen: boolean;
    isPinned: boolean;
  };
  setSidebarOpen: (open: boolean) => void;
  setSidebarPinned: (pinned: boolean) => void;
  toggleSidebar: () => void;
  
  // Navigation states
  navigation: {
    isMobileMenuOpen: boolean;
    activeSection: string;
  };
  setMobileMenuOpen: (open: boolean) => void;
  setActiveSection: (section: string) => void;
  
  // Loading states
  loading: {
    global: boolean;
    content: boolean;
    search: boolean;
    sync: boolean;
    image: boolean;
  };
  setLoading: (key: keyof UIState['loading'], loading: boolean) => void;
  
  // Toast/notification state
  notifications: {
    count: number;
    unread: number;
  };
  setNotificationCount: (count: number) => void;
  setUnreadCount: (count: number) => void;
  
  // Page-specific UI states
  pageStates: {
    [key: string]: Record<string, any>;
  };
  setPageState: (page: string, state: Record<string, any>) => void;
  getPageState: (page: string) => Record<string, any>;
  clearPageState: (page: string) => void;
  
  // Scroll positions (for preserving scroll on navigation)
  scrollPositions: {
    [key: string]: number;
  };
  setScrollPosition: (route: string, position: number) => void;
  getScrollPosition: (route: string) => number;
  
  // Theme and appearance
  appearance: {
    compactMode: boolean;
    showImages: boolean;
    animationsEnabled: boolean;
  };
  setCompactMode: (compact: boolean) => void;
  setShowImages: (show: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  
  // Error states
  errors: {
    global: string | null;
    network: string | null;
    auth: string | null;
  };
  setError: (type: keyof UIState['errors'], error: string | null) => void;
  clearErrors: () => void;
  
  // Reset all UI state
  resetUI: () => void;
}

const defaultState = {
  modals: {
    ageVerification: false,
    emailVerification: false,
    login: false,
    settings: false,
    addToList: false,
    imageViewer: false,
    shareModal: false,
    filterModal: false,
  },
  sidebar: {
    isOpen: false,
    isPinned: false,
  },
  navigation: {
    isMobileMenuOpen: false,
    activeSection: '',
  },
  loading: {
    global: false,
    content: false,
    search: false,
    sync: false,
    image: false,
  },
  notifications: {
    count: 0,
    unread: 0,
  },
  pageStates: {},
  scrollPositions: {},
  appearance: {
    compactMode: false,
    showImages: true,
    animationsEnabled: true,
  },
  errors: {
    global: null,
    network: null,
    auth: null,
  },
};

export const useUIStore = create<UIState>((set, get) => ({
  ...defaultState,
  
  setModal: (modal, open) => 
    set((state) => ({
      modals: { ...state.modals, [modal]: open }
    })),
  
  closeAllModals: () => 
    set((state) => ({
      modals: Object.keys(state.modals).reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {} as typeof state.modals
      )
    })),
  
  setSidebarOpen: (open) => 
    set((state) => ({
      sidebar: { ...state.sidebar, isOpen: open }
    })),
  
  setSidebarPinned: (pinned) => 
    set((state) => ({
      sidebar: { ...state.sidebar, isPinned: pinned }
    })),
  
  toggleSidebar: () => 
    set((state) => ({
      sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen }
    })),
  
  setMobileMenuOpen: (open) => 
    set((state) => ({
      navigation: { ...state.navigation, isMobileMenuOpen: open }
    })),
  
  setActiveSection: (section) => 
    set((state) => ({
      navigation: { ...state.navigation, activeSection: section }
    })),
  
  setLoading: (key, loading) => 
    set((state) => ({
      loading: { ...state.loading, [key]: loading }
    })),
  
  setNotificationCount: (count) => 
    set((state) => ({
      notifications: { ...state.notifications, count }
    })),
  
  setUnreadCount: (count) => 
    set((state) => ({
      notifications: { ...state.notifications, unread: count }
    })),
  
  setPageState: (page, state) => 
    set((currentState) => ({
      pageStates: {
        ...currentState.pageStates,
        [page]: { ...currentState.pageStates[page], ...state }
      }
    })),
  
  getPageState: (page) => {
    const { pageStates } = get();
    return pageStates[page] || {};
  },
  
  clearPageState: (page) => 
    set((state) => {
      const newPageStates = { ...state.pageStates };
      delete newPageStates[page];
      return { pageStates: newPageStates };
    }),
  
  setScrollPosition: (route, position) => 
    set((state) => ({
      scrollPositions: { ...state.scrollPositions, [route]: position }
    })),
  
  getScrollPosition: (route) => {
    const { scrollPositions } = get();
    return scrollPositions[route] || 0;
  },
  
  setCompactMode: (compact) => 
    set((state) => ({
      appearance: { ...state.appearance, compactMode: compact }
    })),
  
  setShowImages: (show) => 
    set((state) => ({
      appearance: { ...state.appearance, showImages: show }
    })),
  
  setAnimationsEnabled: (enabled) => 
    set((state) => ({
      appearance: { ...state.appearance, animationsEnabled: enabled }
    })),
  
  setError: (type, error) => 
    set((state) => ({
      errors: { ...state.errors, [type]: error }
    })),
  
  clearErrors: () => 
    set((state) => ({
      errors: { global: null, network: null, auth: null }
    })),
  
  resetUI: () => set(defaultState),
}));