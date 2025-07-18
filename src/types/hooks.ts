// Hook Return Types and Async Action Interfaces

import { Anime, Manga } from '@/data/animeData';
import { UserAnimeListEntry, UserMangaListEntry } from '@/hooks/useUserLists';

// Anime Detail Hook Types
export interface AnimeDetailData {
  id: string;
  anilist_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis?: string;
  image_url?: string;
  score?: number;
  anilist_score?: number;
  rank?: number;
  popularity?: number;
  year?: number;
  color_theme?: string;
  episodes?: number;
  aired_from?: string;
  aired_to?: string;
  season?: string;
  status: string;
  type: string;
  trailer_url?: string;
  trailer_site?: string;
  trailer_id?: string;
  next_episode_date?: string;
  next_episode_number?: number;
  last_sync_check: string;
  genres: string[];
  studios: string[];
  // Legacy compatibility
  mal_id?: number;
  scored_by?: number;
}

export interface UseAnimeDetailResult {
  anime: AnimeDetailData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Manga Detail Hook Types
export interface MangaDetailData {
  id: string;
  anilist_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis?: string;
  image_url?: string;
  score?: number;
  anilist_score?: number;
  rank?: number;
  popularity?: number;
  year?: number;
  color_theme?: string;
  chapters?: number;
  volumes?: number;
  published_from?: string;
  published_to?: string;
  status: string;
  type: string;
  next_chapter_date?: string;
  next_chapter_number?: number;
  last_sync_check: string;
  genres: string[];
  authors: string[];
  // Legacy compatibility
  mal_id?: number;
  scored_by?: number;
}

export interface UseMangaDetailResult {
  manga: MangaDetailData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Analytics Hook Types
export interface AnalyticsResults {
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: number;
  };
  contentStats: {
    totalAnime: number;
    totalManga: number;
    mostPopular: Anime[];
    recentlyAdded: Array<{
      id: string;
      title: string;
      type: 'anime' | 'manga';
      added_date: string;
    }>;
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

export interface UseAnalyticsResult {
  analytics: AnalyticsResults | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  trackAction: (action: string, metadata?: Record<string, unknown>) => Promise<void>;
}

// AniList Data Hook Types
export interface AniListDataResult {
  data: Anime[] | null;
  loading: boolean;
  error: string | null;
  searchAnime: (query: string) => Promise<Anime[]>;
  getAnimeDetails: (id: number) => Promise<Anime | null>;
}

// Bulk Operations Hook Types
export interface BulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
}

export type BulkUpdateFunction<T> = (id: string, updates: T) => Promise<void>;
export type BulkDeleteFunction = (id: string) => Promise<void>;

export interface UseBulkOperationsResult {
  isProcessing: boolean;
  progress: number;
  bulkUpdateStatus: (
    status: string,
    updateFn: BulkUpdateFunction<{ status: string }>
  ) => Promise<BulkOperationResult>;
  bulkDelete: (deleteFn: BulkDeleteFunction) => Promise<BulkOperationResult>;
  bulkUpdateRating: (
    rating: number,
    updateFn: BulkUpdateFunction<{ score: number }>
  ) => Promise<BulkOperationResult>;
  selectedItems: Set<string>;
  toggleItem: (id: string) => void;
  selectAll: (items: Array<{ id: string }>) => void;
  clearSelection: () => void;
}

// Network Status Hook Types
export interface UseNetworkStatusResult {
  isOnline: boolean;
  isOffline: boolean;
  wasRecentlyOffline: boolean;
  retryQueue: Array<{
    id: string;
    operation: () => Promise<unknown>;
    retryCount: number;
    lastAttempt: Date;
  }>;
  addToRetryQueue: (operation: () => Promise<unknown>) => void;
  clearRetryQueue: () => void;
  processRetryQueue: () => Promise<void>;
}

// Enhanced Query Hook Types
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

export interface UseEnhancedQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  isRefetching: boolean;
  isFetching: boolean;
}

// Async Action Types
export interface AsyncActionState {
  loading: boolean;
  error: string | null;
  data: unknown;
}

export interface AsyncActionResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  execute: (...args: unknown[]) => Promise<T>;
  reset: () => void;
}

// Generic Hook State
export interface HookState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Pagination State
export interface PaginationState {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

// Filter State for API calls
export interface FilterState {
  search?: string;
  genre?: string;
  status?: string;
  type?: string;
  year?: string;
  season?: string;
  sort_by: string;
  order: 'asc' | 'desc';
}