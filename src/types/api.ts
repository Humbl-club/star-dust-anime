// API Response Types for comprehensive type safety

// Base API Response Structure
export interface ApiResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters: {
    search?: string;
    genre?: string;
    status?: string;
    type?: string;
    year?: string;
    season?: string;
    sort_by: string;
    order: string;
  };
}

// Enhanced Query Hook Options
export interface UseEnhancedQueryOptions<T> {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number;
  retryDelay?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

// Enhanced Query Result
export interface UseEnhancedQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  isRefetching: boolean;
  isFetching: boolean;
}

// API Data Hook Options
export interface UseApiDataOptions {
  contentType: 'anime' | 'manga';
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  status?: string;
  type?: string;
  year?: string;
  season?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  autoFetch?: boolean;
}

// API Data Hook Return Type
export interface UseApiDataResult<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  syncFromExternal: (pages?: number) => Promise<{
    success: boolean;
    message: string;
    results?: {
      titlesInserted: number;
      detailsInserted: number;
      genresCreated: number;
      studiosCreated: number;
      authorsCreated: number;
      relationshipsCreated: number;
      errors: string[];
    };
  }>;
  syncImages: (limit?: number) => Promise<{
    success: boolean;
    message: string;
    results?: {
      processed: number;
      updated: number;
      errors: string[];
    };
  }>;
  refetch: () => Promise<void>;
}

// Supabase Function Response Types
export interface SupabaseFunctionResponse<T> {
  data?: T;
  error?: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  };
}

// Sync Response Types
export interface SyncResponse {
  success: boolean;
  message: string;
  titlesInserted?: number;
  detailsInserted?: number;
  genresCreated?: number;
  studiosCreated?: number;
  authorsCreated?: number;
  relationshipsCreated?: number;
  errors?: string[];
}

export interface ImageSyncResponse {
  success: boolean;
  message: string;
  processed?: number;
  updated?: number;
  errors?: string[];
}

// Analytics Types
export interface AnalyticsData {
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: number;
  };
  contentStats: {
    totalAnime: number;
    totalManga: number;
    mostPopular: PopularContentItem[];
    recentlyAdded: ContentItem[];
  };
  searchAnalytics: {
    totalSearches: number;
    aiSearches: number;
    searchSuccessRate: number;
    popularQueries: string[];
  };
  recommendations: {
    totalRecommendations: number;
    clickThroughRate: number;
    topRecommendedGenres: string[];
  };
}

export interface PopularContentItem {
  id: string;
  title: string;
  image_url?: string;
  score?: number;
  popularity?: number;
}

export interface ContentItem {
  id: string;
  title: string;
  type: 'anime' | 'manga';
  added_date: string;
}

// Error Response Type
export interface ErrorResponse {
  message: string;
  code?: string;
  details?: string;
  correlationId?: string;
  timestamp?: string;
}