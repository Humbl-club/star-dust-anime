// Unified database types for the new normalized schema
export interface ListStatus {
  id: string;
  name: string;
  label: string;
  description?: string;
  media_type: 'anime' | 'manga' | 'both';
  sort_order: number;
  created_at: string;
}

export interface UserTitleListEntry {
  id: string;
  user_id: string;
  title_id: string;
  media_type: 'anime' | 'manga';
  status_id: string;
  episodes_watched: number;
  chapters_read: number;
  volumes_read: number;
  score?: number;
  start_date?: string;
  finish_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data from related tables
  status?: ListStatus;
  title?: {
    id: string;
    anilist_id: number;
    title: string;
    title_english?: string;
    title_japanese?: string;
    synopsis?: string;
    image_url?: string;
    score?: number;
    year?: number;
  };
  anime_details?: {
    id: string;
    episodes?: number;
    status?: string;
    type?: string;
    season?: string;
    aired_from?: string;
    aired_to?: string;
    trailer_url?: string;
  };
  manga_details?: {
    id: string;
    chapters?: number;
    volumes?: number;
    status?: string;
    type?: string;
    published_from?: string;
    published_to?: string;
  };
}

// Legacy interfaces for backward compatibility
export interface UserAnimeListEntry {
  id: string;
  user_id: string;
  title_id: string;
  anime_detail_id?: string;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  episodes_watched: number;
  score?: number;
  start_date?: string;
  finish_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  title?: {
    id: string;
    anilist_id: number;
    title: string;
    title_english?: string;
    title_japanese?: string;
    synopsis?: string;
    image_url?: string;
    score?: number;
    year?: number;
  };
  anime_details?: {
    id: string;
    episodes?: number;
    status?: string;
    type?: string;
    season?: string;
    aired_from?: string;
    aired_to?: string;
    trailer_url?: string;
    titles?: {
      id: string;
      anilist_id: number;
      title: string;
      title_english?: string;
      title_japanese?: string;
      synopsis?: string;
      image_url?: string;
      score?: number;
      year?: number;
    };
  };
}

export interface UserMangaListEntry {
  id: string;
  user_id: string;
  title_id: string;
  manga_detail_id?: string;
  status: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';
  chapters_read: number;
  volumes_read: number;
  score?: number;
  start_date?: string;
  finish_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  title?: {
    id: string;
    anilist_id: number;
    title: string;
    title_english?: string;
    title_japanese?: string;
    synopsis?: string;
    image_url?: string;
    score?: number;
    year?: number;
  };
  manga_details?: {
    id: string;
    chapters?: number;
    volumes?: number;
    status?: string;
    type?: string;
    published_from?: string;
    published_to?: string;
    titles?: {
      id: string;
      anilist_id: number;
      title: string;
      title_english?: string;
      title_japanese?: string;
      synopsis?: string;
      image_url?: string;
      score?: number;
      year?: number;
    };
  };
}

// Status mapping for backward compatibility
export const STATUS_MAPPING = {
  anime: {
    'watching': 'watching',
    'completed': 'completed',
    'on_hold': 'on_hold',
    'dropped': 'dropped',
    'plan_to_watch': 'plan_to_watch'
  },
  manga: {
    'reading': 'reading',
    'completed': 'completed',
    'on_hold': 'on_hold_manga',
    'dropped': 'dropped_manga',
    'plan_to_read': 'plan_to_read'
  }
} as const;

// Status labels for UI display
export const STATUS_LABELS = {
  anime: {
    'watching': 'Watching',
    'completed': 'Completed',
    'on_hold': 'On Hold',
    'dropped': 'Dropped',
    'plan_to_watch': 'Plan to Watch'
  },
  manga: {
    'reading': 'Reading',
    'completed': 'Completed',
    'on_hold': 'On Hold',
    'dropped': 'Dropped',
    'plan_to_read': 'Plan to Read'
  }
} as const;

export type AnimeStatus = keyof typeof STATUS_LABELS.anime;
export type MangaStatus = keyof typeof STATUS_LABELS.manga;