
// Unified database types for the new normalized schema
export interface Title {
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
  members?: number;
  favorites?: number;
  year?: number;
  color_theme?: string;
  created_at: string;
  updated_at: string;
}

export interface AnimeDetail {
  title_id: string; // Now the primary key
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
  created_at: string;
  updated_at: string;
}

export interface MangaDetail {
  title_id: string; // Now the primary key
  chapters?: number;
  volumes?: number;
  published_from?: string;
  published_to?: string;
  status: string;
  type: string;
  next_chapter_date?: string;
  next_chapter_number?: number;
  last_sync_check: string;
  created_at: string;
  updated_at: string;
}

export interface Genre {
  id: string;
  name: string;
  type: 'anime' | 'manga' | 'both';
  created_at: string;
}

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

// Combined views for API responses
export interface AnimeWithDetails extends Title {
  // Anime-specific fields
  episodes?: number;
  aired_from?: string;
  aired_to?: string;
  season?: string;
  trailer_url?: string;
  trailer_site?: string;
  trailer_id?: string;
  next_episode_date?: string;
  next_episode_number?: number;
  last_sync_check: string;
  
  // Related data
  genres?: string[];
  studios?: string[];
  
  // Legacy compatibility
  mal_id?: number;
  scored_by?: number;
}

export interface MangaWithDetails extends Title {
  // Manga-specific fields
  chapters?: number;
  volumes?: number;
  published_from?: string;
  published_to?: string;
  next_chapter_date?: string;
  next_chapter_number?: number;
  last_sync_check: string;
  
  // Related data
  genres?: string[];
  authors?: string[];
  
  // Legacy compatibility
  mal_id?: number;
  scored_by?: number;
}

// API Response types
export interface DatabaseApiResponse<T> {
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
