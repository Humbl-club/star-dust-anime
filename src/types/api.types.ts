// API Response Types
export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface ApiFilters {
  search?: string;
  genre?: string;
  status?: string;
  type?: string;
  year?: string;
  season?: string;
  sort_by: string;
  order: string;
}

export interface ApiResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  filters: ApiFilters;
}

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Content Types
export interface BaseContent {
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
  num_users_voted?: number;
  created_at: string;
  updated_at: string;
}

export interface AnimeContent extends BaseContent {
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
  genres?: string[];
  studios?: string[];
  mal_id?: number;
  scored_by?: number;
}

export interface MangaContent extends BaseContent {
  chapters?: number;
  volumes?: number;
  published_from?: string;
  published_to?: string;
  status: string;
  type: string;
  next_chapter_date?: string;
  next_chapter_number?: number;
  last_sync_check: string;
  genres?: string[];
  authors?: string[];
  mal_id?: number;
  scored_by?: number;
}

// Search Types
export interface SearchOptions {
  query: string;
  type?: 'anime' | 'manga' | 'both';
  limit?: number;
  genres?: string[];
  year?: string;
  status?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  autoSearch?: boolean;
}

export interface SearchResult {
  anime: AnimeContent[];
  manga: MangaContent[];
  totalResults: number;
}

// Filter Types
export interface FilterOptions {
  genres: string[];
  year: string;
  status: string;
  type: string;
  season: string;
  sort_by: string;
  order: 'asc' | 'desc';
}

export interface FilterPreset {
  id: string;
  name: string;
  content_type: 'anime' | 'manga';
  filters: Partial<FilterOptions>;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Query Options
export interface BaseQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  genre?: string;
  year?: string;
  status?: string;
  type?: string;
  season?: string;
}

export interface ContentQueryOptions extends BaseQueryOptions {
  contentType: 'anime' | 'manga';
}

// Sync Types
export interface SyncResponse {
  success: boolean;
  message: string;
  itemsProcessed?: number;
  errors?: string[];
}

// User Related Types
export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  birth_date?: string;
  role: string;
  verification_status: string;
  verification_required_until?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  privacy_level: string;
  list_visibility: string;
  show_adult_content: boolean;
  preferred_genres: string[];
  excluded_genres: string[];
  notification_settings: {
    push: boolean;
    email: boolean;
    follows: boolean;
    reviews: boolean;
  };
  auto_add_sequels: boolean;
  created_at: string;
  updated_at: string;
}

// Gamification Types
export interface UserGamification {
  login_streak: number;
  current_username: string;
  username_tier: string;
  loot_boxes: LootBox[];
  recent_activities: Activity[];
}

export interface LootBox {
  id: string;
  box_type: string;
  quantity: number;
}

export interface Activity {
  id: string;
  activity_type: string;
  points_earned: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Review Types
export interface Review {
  id: string;
  title_id: string;
  user_id: string;
  title?: string;
  content: string;
  rating?: number;
  spoiler_warning: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewReaction {
  id: string;
  review_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

// Comment Types
export interface Comment {
  id: string;
  title_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Genre Types
export interface Genre {
  id: string;
  name: string;
  type: 'anime' | 'manga' | 'both';
  created_at: string;
}

// Studio/Author Types
export interface Studio {
  id: string;
  name: string;
  created_at: string;
}

export interface Author {
  id: string;
  name: string;
  created_at: string;
}

// Validation Types
export interface ScoreValidation {
  id: string;
  title_id: string;
  user_id: string;
  validation_type: string;
  created_at: string;
  updated_at: string;
}

// List Types
export interface ListStatus {
  id: string;
  name: string;
  label: string;
  description?: string;
  media_type: 'anime' | 'manga';
  sort_order: number;
  created_at: string;
}

export interface UserTitleList {
  id: string;
  user_id: string;
  title_id: string;
  status_id: string;
  media_type: 'anime' | 'manga';
  score?: number;
  episodes_watched: number;
  chapters_read: number;
  volumes_read: number;
  start_date?: string;
  finish_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserTitleProgress {
  id: string;
  user_id: string;
  title_id: string;
  current_episode: number;
  current_chapter: number;
  last_updated: string;
}