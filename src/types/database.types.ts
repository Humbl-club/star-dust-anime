// Database types for Supabase integration
// Note: Run 'npx supabase gen types typescript --project-id axtpbgsjbmhbuqomarcr > src/types/database.generated.ts' to generate types

// Additional custom database types
export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface DatabaseResponse<T> {
  data: T | null;
  error: DatabaseError | null;
}

export interface DatabaseArrayResponse<T> {
  data: T[] | null;
  error: DatabaseError | null;
  count?: number;
}

// Enum types for better type safety
export type UsernameTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'GOD';
export type VerificationStatus = 'pending' | 'verified' | 'expired';
export type PrivacyLevel = 'public' | 'friends' | 'private';
export type ListVisibility = 'public' | 'private';
export type ContentType = 'anime' | 'manga';
export type MediaType = 'anime' | 'manga';
export type UserRole = 'user' | 'moderator' | 'admin';
export type AnimeStatus = 'Currently Airing' | 'Finished Airing' | 'Not yet aired';
export type MangaStatus = 'Publishing' | 'Finished' | 'Cancelled' | 'Hiatus';
export type AnimeType = 'TV' | 'Movie' | 'Special' | 'OVA' | 'ONA';
export type MangaType = 'Manga' | 'Manhwa' | 'Manhua' | 'Novel' | 'Light Novel' | 'One-shot';
export type Season = 'Winter' | 'Spring' | 'Summer' | 'Fall';
export type SortOrder = 'asc' | 'desc';
export type ReactionType = 'like' | 'dislike' | 'helpful' | 'funny';
export type ActivityType = 'login' | 'review_posted' | 'list_updated' | 'loot_box_opened';
export type LootBoxType = 'standard' | 'premium' | 'ultra';
export type EmailType = 'verification' | 'password_reset' | 'notification';
export type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';

// Union types for specific use cases
export type ContentStatus = AnimeStatus | MangaStatus;
export type ContentTypeValue = AnimeType | MangaType;

// Utility types for database operations
export type InsertTables = {
  [K in keyof Database['public']['Tables']]: Database['public']['Tables'][K]['Insert'];
};

export type UpdateTables = {
  [K in keyof Database['public']['Tables']]: Database['public']['Tables'][K]['Update'];
};

export type SelectTables = {
  [K in keyof Database['public']['Tables']]: Database['public']['Tables'][K]['Row'];
};

// Common database patterns
export interface TimestampedEntity {
  created_at: string;
  updated_at: string;
}

export interface UserOwnedEntity {
  user_id: string;
}

export interface SoftDeletableEntity {
  deleted_at?: string;
}

// Query builder types
export interface QueryOptions {
  select?: string;
  eq?: Record<string, unknown>;
  neq?: Record<string, unknown>;
  gt?: Record<string, unknown>;
  gte?: Record<string, unknown>;
  lt?: Record<string, unknown>;
  lte?: Record<string, unknown>;
  like?: Record<string, unknown>;
  ilike?: Record<string, unknown>;
  in?: Record<string, unknown[]>;
  contains?: Record<string, unknown>;
  order?: Record<string, SortOrder>;
  limit?: number;
  offset?: number;
}

// RLS policy types
export interface RLSContext {
  user_id?: string;
  role?: UserRole;
}

// Function return types
export interface FunctionResponse<T = unknown> {
  data: T;
  error?: string;
}

// Webhook types
export interface WebhookPayload<T = unknown> {
  type: string;
  table: string;
  record: T;
  schema: string;
  old_record?: T;
}

// Storage types
export interface StorageFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
}

export interface StorageUploadOptions {
  cacheControl?: string;
  contentType?: string;
  duplex?: boolean;
  upsert?: boolean;
}

// Auth types
export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
}

// Edge function types
export interface EdgeFunctionRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface EdgeFunctionResponse<T = unknown> {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: T;
}

// Realtime types
export interface RealtimePayload<T = unknown> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
}

export interface RealtimeChannel {
  topic: string;
  state: 'closed' | 'errored' | 'joined' | 'joining' | 'leaving';
}

// Database utility types for better DX
export type TableName = keyof Database['public']['Tables'];
export type ViewName = keyof Database['public']['Views'];
export type FunctionName = keyof Database['public']['Functions'];

// Type helpers for nullable fields
export type NonNullable<T> = T extends null | undefined ? never : T;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Placeholder for generated types
export interface Database {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
    }>;
    Views: Record<string, {
      Row: Record<string, unknown>;
    }>;
    Functions: Record<string, {
      Args: Record<string, unknown>;
      Returns: unknown;
    }>;
    Enums: Record<string, string>;
  };
}