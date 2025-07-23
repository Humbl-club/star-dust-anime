// Types for offline sync operations and user lists
export interface UserTitleListItem {
  id: string;
  user_id: string;
  title_id: string;
  media_type: 'anime' | 'manga';
  status_id: string;
  rating?: number;
  progress?: number;
  notes?: string;
  added_at: string;
  updated_at: string;
  sort_order?: number;
}

export interface OfflineActionData {
  add_to_list: {
    user_id: string;
    title_id: string;
    media_type: 'anime' | 'manga';
    status_id: string;
  };
  update_progress: {
    list_item_id: string;
    progress: number;
  };
  rate_title: {
    list_item_id: string;
    rating: number;
  };
  write_review: {
    title_id: string;
    user_id: string;
    content: string;
    rating?: number;
    spoiler_warning?: boolean;
    title?: string;
  };
  update_status: {
    list_item_id: string;
    status_id: string;
  };
  update_notes: {
    list_item_id: string;
    notes: string;
  };
}

export interface SyncableUserListItem {
  id: string;
  title_id: string;
  user_id: string;
  status_id: string;
  media_type: 'anime' | 'manga';
  rating?: number;
  progress?: number;
  notes?: string;
  cached_at: number;
  sync_status: 'synced' | 'pending' | 'failed';
  sort_order?: number;
}

export interface OfflineActionBase {
  id: string;
  timestamp: number;
  retry_count: number;
}

export interface OfflineAction<T extends keyof OfflineActionData = keyof OfflineActionData> extends OfflineActionBase {
  type: T;
  data: OfflineActionData[T];
}

export interface SyncError {
  action_id: string;
  error_message: string;
  timestamp: number;
  retry_count: number;
}

export interface SyncResult {
  success: boolean;
  synced_count: number;
  failed_count: number;
  errors: SyncError[];
}

// Legacy types for backward compatibility
export interface UserAnimeListEntry extends UserTitleListItem {
  media_type: 'anime';
  episodes_watched?: number;
  score?: number;
  status?: string;
  start_date?: string;
  finish_date?: string;
  created_at?: string;
  anime_details?: any;
  title?: any;
}

export interface UserMangaListEntry extends UserTitleListItem {
  media_type: 'manga';
  chapters_read?: number;
  volumes_read?: number;
  score?: number;
  status?: string;
  start_date?: string;
  finish_date?: string;
  created_at?: string;
  manga_details?: any;
  title?: any;
}

export interface UserTitleListEntry extends UserTitleListItem {
  episodes_watched?: number;
  chapters_read?: number;
  volumes_read?: number;
  score?: number;
  status?: string;
  start_date?: string;
  finish_date?: string;
  created_at?: string;
  anime_details?: any;
  manga_details?: any;
  title?: any;
}

export interface ListStatus {
  id: string;
  name: string;
  label: string;
  media_type: 'anime' | 'manga' | 'both';
  sort_order: number;
}

export type AnimeStatus = string;
export type MangaStatus = string;

export const STATUS_LABELS = {
  watching: 'Watching',
  completed: 'Completed',
  on_hold: 'On Hold',
  dropped: 'Dropped',
  plan_to_watch: 'Plan to Watch',
  reading: 'Reading',
  plan_to_read: 'Plan to Read'
} as const;

export const STATUS_MAPPING = {
  anime: {
    watching: 'watching',
    completed: 'completed',
    on_hold: 'on_hold',
    dropped: 'dropped',
    plan_to_watch: 'plan_to_watch'
  },
  manga: {
    reading: 'reading',
    completed: 'completed',
    on_hold: 'on_hold',
    dropped: 'dropped',
    plan_to_read: 'plan_to_read'
  }
} as const;