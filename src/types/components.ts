// Component Props and Event Handler Types

import { ReactNode, MouseEvent, ChangeEvent, FormEvent } from 'react';
import { Anime, Manga } from '@/data/animeData';
import { UserAnimeListEntry, UserMangaListEntry } from '@/hooks/useUserLists';

// Base Component Props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Button Size and Variant Types
export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive';
export type ButtonSize = 'sm' | 'default' | 'lg';

// Add To List Button Props
export interface AddToListButtonProps {
  item: Anime | Manga;
  type: 'anime' | 'manga';
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

// Anime Card Props
export interface AnimeCardProps {
  anime: Anime;
  onClick?: () => void;
  showCountdown?: boolean;
  getDisplayName?: (anime: Anime) => string;
}

// Analytics Charts Props
export interface AnalyticsChartsProps {
  analytics: {
    userActivity: {
      totalUsers: number;
      activeUsers: number;
      newUsers: number;
      userGrowth: number;
    };
    contentStats: {
      totalAnime: number;
      totalManga: number;
      mostPopular: Array<{
        id: string;
        title: string;
        image_url?: string;
        score?: number;
        popularity?: number;
      }>;
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
  };
}

// Stat Card Props for Analytics
export interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
}

// Anime Stats Props
export interface AnimeStatsProps {
  userAnimeData?: Anime[];
  userMangaData?: Manga[];
}

// Content Report Modal Props
export interface ContentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'anime' | 'manga' | 'user' | 'review';
  contentTitle?: string;
}

// Curated Lists Props
export interface CuratedListsProps {
  title: string;
  items: (Anime | Manga)[];
  type: 'anime' | 'manga';
  className?: string;
}

// Detail Image Card Props
export interface DetailImageCardProps {
  title: string;
  imageUrl?: string;
  score?: number;
  year?: number;
  status?: string;
  type?: string;
  item: Anime | Manga; // For AddToListButton
}

// SEO Meta Tags Props
export interface AnimeMetaTagsProps {
  anime: {
    title: string;
    synopsis?: string;
    image_url?: string;
    score?: number;
    year?: number;
    genres?: string[];
  };
}

export interface MangaMetaTagsProps {
  manga: {
    title: string;
    synopsis?: string;
    image_url?: string;
    score?: number;
    year?: number;
    genres?: string[];
  };
}

// Search Input Props
export interface SearchInputProps {
  value: string;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

// Working Search Dropdown Props
export interface WorkingSearchDropdownProps {
  searchTerm: string;
  onResultClick: (anime: Anime) => void;
  isVisible: boolean;
  onClose: () => void;
}

// Navigation Props
export interface NavigationProps {
  onAnimeClick: (anime: Anime) => void;
}

// Hybrid Recommendations Props
export interface HybridRecommendationsProps {
  userPreferences?: {
    genres: string[];
    excludedGenres: string[];
  };
  currentAnime?: Anime;
  onAnimeClick: (anime: Anime) => void;
}

// Personalized Dashboard Props
export interface PersonalizedDashboardProps {
  userId?: string;
}

// Advanced Filtering Props
export interface FilterOptions {
  genre: string;
  status: string;
  type: string;
  year: string;
  season: string;
  sort_by: string;
  order: 'asc' | 'desc';
}

export interface AdvancedFilteringProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  contentType: 'anime' | 'manga';
}

// Event Handler Types
export type ClickHandler = (event: MouseEvent<HTMLElement>) => void;
export type ChangeHandler = (event: ChangeEvent<HTMLInputElement>) => void;
export type FormSubmitHandler = (event: FormEvent<HTMLFormElement>) => void;
export type SelectHandler = (value: string) => void;

// Status Configuration Types
export interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface StatusConfigMap {
  anime: Record<UserAnimeListEntry['status'], StatusConfig>;
  manga: Record<UserMangaListEntry['status'], StatusConfig>;
}

// Filter Update Handler Type
export type FilterUpdateHandler = (key: keyof FilterOptions, value: string) => void;

// Generic Item Click Handler
export type ItemClickHandler<T> = (item: T) => void;