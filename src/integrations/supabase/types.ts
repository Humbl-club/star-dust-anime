export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_type: string | null
          anime_id: string | null
          created_at: string | null
          id: string
          manga_id: string | null
          metadata: Json | null
          title_id: string | null
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          anime_id?: string | null
          created_at?: string | null
          id?: string
          manga_id?: string | null
          metadata?: Json | null
          title_id?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          anime_id?: string | null
          created_at?: string | null
          id?: string
          manga_id?: string | null
          metadata?: Json | null
          title_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      anime_details: {
        Row: {
          aired_from: string | null
          aired_to: string | null
          created_at: string | null
          episodes: number | null
          last_sync_check: string | null
          next_episode_date: string | null
          next_episode_number: number | null
          season: string | null
          status: string | null
          title_id: string
          trailer_id: string | null
          trailer_site: string | null
          trailer_url: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          aired_from?: string | null
          aired_to?: string | null
          created_at?: string | null
          episodes?: number | null
          last_sync_check?: string | null
          next_episode_date?: string | null
          next_episode_number?: number | null
          season?: string | null
          status?: string | null
          title_id: string
          trailer_id?: string | null
          trailer_site?: string | null
          trailer_url?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          aired_from?: string | null
          aired_to?: string | null
          created_at?: string | null
          episodes?: number | null
          last_sync_check?: string | null
          next_episode_date?: string | null
          next_episode_number?: number | null
          season?: string | null
          status?: string | null
          title_id?: string
          trailer_id?: string | null
          trailer_site?: string | null
          trailer_url?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anime_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anime_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anime_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anime_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anime_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anime_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anime_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      api_attributions: {
        Row: {
          attribution_text: string
          created_at: string | null
          id: string
          is_active: boolean | null
          license_url: string | null
          privacy_url: string | null
          service_name: string
          terms_url: string | null
        }
        Insert: {
          attribution_text: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          license_url?: string | null
          privacy_url?: string | null
          service_name: string
          terms_url?: string | null
        }
        Update: {
          attribution_text?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          license_url?: string | null
          privacy_url?: string | null
          service_name?: string
          terms_url?: string | null
        }
        Relationships: []
      }
      authors: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      cache_performance_metrics: {
        Row: {
          cache_key: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          timestamp: string | null
        }
        Insert: {
          cache_key?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          timestamp?: string | null
        }
        Update: {
          cache_key?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          timestamp?: string | null
        }
        Relationships: []
      }
      character_voice_actors: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          is_main: boolean | null
          language: string
          person_id: string
          title_id: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          is_main?: boolean | null
          language?: string
          person_id: string
          title_id: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          is_main?: boolean | null
          language?: string
          person_id?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_voice_actors_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_voice_actors_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_voice_actors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_voice_actors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_voice_actors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_voice_actors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_voice_actors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_voice_actors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_voice_actors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          anilist_id: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          mal_id: number | null
          name: string
          name_alternative: Json | null
          name_japanese: string | null
          role: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          anilist_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          mal_id?: number | null
          name: string
          name_alternative?: Json | null
          name_japanese?: string | null
          role?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          anilist_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          mal_id?: number | null
          name?: string
          name_alternative?: Json | null
          name_japanese?: string | null
          role?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      claimed_usernames: {
        Row: {
          claimed_at: string | null
          id: string
          is_active: boolean | null
          tier: Database["public"]["Enums"]["username_tier"]
          user_id: string | null
          username: string
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          is_active?: boolean | null
          tier: Database["public"]["Enums"]["username_tier"]
          user_id?: string | null
          username: string
        }
        Update: {
          claimed_at?: string | null
          id?: string
          is_active?: boolean | null
          tier?: Database["public"]["Enums"]["username_tier"]
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "claimed_usernames_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_user_statistics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "claimed_usernames_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_characters: {
        Row: {
          anilist_id: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          mal_id: number | null
          name: string
          name_alternative: Json | null
          name_japanese: string | null
          role: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          anilist_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          mal_id?: number | null
          name: string
          name_alternative?: Json | null
          name_japanese?: string | null
          role?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          anilist_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          mal_id?: number | null
          name?: string
          name_alternative?: Json | null
          name_japanese?: string | null
          role?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          moderator_notes: string | null
          report_reason: string | null
          reported_content_id: string
          reported_content_type: string | null
          reporter_user_id: string | null
          resolved_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          moderator_notes?: string | null
          report_reason?: string | null
          reported_content_id: string
          reported_content_type?: string | null
          reporter_user_id?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          moderator_notes?: string | null
          report_reason?: string | null
          reported_content_id?: string
          reported_content_type?: string | null
          reporter_user_id?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      content_sync_status: {
        Row: {
          completed_at: string | null
          content_type: string | null
          current_page: number | null
          error_message: string | null
          id: string
          next_run_at: string | null
          operation_type: string | null
          processed_items: number | null
          started_at: string | null
          status: string | null
          total_items: number | null
        }
        Insert: {
          completed_at?: string | null
          content_type?: string | null
          current_page?: number | null
          error_message?: string | null
          id?: string
          next_run_at?: string | null
          operation_type?: string | null
          processed_items?: number | null
          started_at?: string | null
          status?: string | null
          total_items?: number | null
        }
        Update: {
          completed_at?: string | null
          content_type?: string | null
          current_page?: number | null
          error_message?: string | null
          id?: string
          next_run_at?: string | null
          operation_type?: string | null
          processed_items?: number | null
          started_at?: string | null
          status?: string | null
          total_items?: number | null
        }
        Relationships: []
      }
      content_tags: {
        Row: {
          anilist_id: number | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_adult: boolean | null
          is_spoiler: boolean | null
          kitsu_id: number | null
          name: string
          rank: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          anilist_id?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_adult?: boolean | null
          is_spoiler?: boolean | null
          kitsu_id?: number | null
          name: string
          rank?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          anilist_id?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_adult?: boolean | null
          is_spoiler?: boolean | null
          kitsu_id?: number | null
          name?: string
          rank?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string | null
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_01: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_02: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_03: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_04: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_05: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_06: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_07: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_08: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_09: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_10: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_11: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2024_12: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2025_01: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2025_02: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_2025_09: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      cron_job_logs_archive_default: {
        Row: {
          details: Json | null
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      daily_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          points_earned: number
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id?: string
        }
        Relationships: []
      }
      dead_letter_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          next_retry_at: string | null
          operation_type: string
          payload: Json
          retry_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          operation_type: string
          payload: Json
          retry_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          operation_type?: string
          payload?: Json
          retry_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      edge_function_test_results: {
        Row: {
          error_message: string | null
          function_name: string
          id: string
          response_data: Json | null
          status: string | null
          test_time: string | null
        }
        Insert: {
          error_message?: string | null
          function_name: string
          id?: string
          response_data?: Json | null
          status?: string | null
          test_time?: string | null
        }
        Update: {
          error_message?: string | null
          function_name?: string
          id?: string
          response_data?: Json | null
          status?: string | null
          test_time?: string | null
        }
        Relationships: []
      }
      email_delivery_tracking: {
        Row: {
          correlation_id: string
          created_at: string | null
          delivered_at: string | null
          delivery_status: string
          email: string
          email_type: string
          error_message: string | null
          external_id: string | null
          failed_at: string | null
          id: string
          metadata: Json | null
          provider: string
          retry_count: number | null
          sent_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          correlation_id: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string
          email: string
          email_type?: string
          error_message?: string | null
          external_id?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          retry_count?: number | null
          sent_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          correlation_id?: string
          created_at?: string | null
          delivered_at?: string | null
          delivery_status?: string
          email?: string
          email_type?: string
          error_message?: string | null
          external_id?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          retry_count?: number | null
          sent_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          correlation_id: string | null
          created_at: string | null
          email: string
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          next_retry_at: string | null
          retries: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string | null
          email: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          next_retry_at?: string | null
          retries?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string | null
          email?: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          next_retry_at?: string | null
          retries?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_sent: {
        Row: {
          correlation_id: string | null
          email: string
          email_type: string
          id: string
          metadata: Json | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          correlation_id?: string | null
          email: string
          email_type: string
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          correlation_id?: string | null
          email?: string
          email_type?: string
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_template_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
          rendered_html: string
          template_name: string
          template_version: string
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          rendered_html: string
          template_name: string
          template_version: string
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          rendered_html?: string
          template_name?: string
          template_version?: string
        }
        Relationships: []
      }
      email_verification_status: {
        Row: {
          created_at: string | null
          email: string
          id: string
          last_attempt_at: string | null
          updated_at: string | null
          user_id: string
          verification_attempts: number | null
          verification_expires_at: string | null
          verification_sent_at: string | null
          verification_status: string
          verification_token: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          last_attempt_at?: string | null
          updated_at?: string | null
          user_id: string
          verification_attempts?: number | null
          verification_expires_at?: string | null
          verification_sent_at?: string | null
          verification_status?: string
          verification_token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          last_attempt_at?: string | null
          updated_at?: string | null
          user_id?: string
          verification_attempts?: number | null
          verification_expires_at?: string | null
          verification_sent_at?: string | null
          verification_status?: string
          verification_token?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_message: string
          id: string
        }
        Insert: {
          created_at?: string | null
          error_message: string
          id?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string
          id?: string
        }
        Relationships: []
      }
      generated_characters: {
        Row: {
          character_data: Json
          created_at: string
          generation_method: string
          id: string
          tier: Database["public"]["Enums"]["username_tier"]
          username: string
        }
        Insert: {
          character_data?: Json
          created_at?: string
          generation_method?: string
          id?: string
          tier: Database["public"]["Enums"]["username_tier"]
          username: string
        }
        Update: {
          character_data?: Json
          created_at?: string
          generation_method?: string
          id?: string
          tier?: Database["public"]["Enums"]["username_tier"]
          username?: string
        }
        Relationships: []
      }
      genres: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string | null
          type?: string | null
        }
        Relationships: []
      }
      genres_new: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_adult: boolean | null
          name: string
          parent_genre_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_adult?: boolean | null
          name: string
          parent_genre_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_adult?: boolean | null
          name?: string
          parent_genre_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "genres_new_parent_genre_id_fkey"
            columns: ["parent_genre_id"]
            isOneToOne: false
            referencedRelation: "genres_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genres_new_parent_genre_id_fkey"
            columns: ["parent_genre_id"]
            isOneToOne: false
            referencedRelation: "mv_popular_genres"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          content: string
          effective_date: string | null
          id: string
          last_updated: string | null
          page_type: string | null
          title: string
          version: string | null
        }
        Insert: {
          content: string
          effective_date?: string | null
          id?: string
          last_updated?: string | null
          page_type?: string | null
          title: string
          version?: string | null
        }
        Update: {
          content?: string
          effective_date?: string | null
          id?: string
          last_updated?: string | null
          page_type?: string | null
          title?: string
          version?: string | null
        }
        Relationships: []
      }
      list_statuses: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          label: string
          media_type: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          label: string
          media_type: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string
          media_type?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      manga_details: {
        Row: {
          chapters: number | null
          created_at: string | null
          last_sync_check: string | null
          next_chapter_date: string | null
          next_chapter_number: number | null
          published_from: string | null
          published_to: string | null
          status: string | null
          title_id: string
          type: string | null
          updated_at: string | null
          volumes: number | null
        }
        Insert: {
          chapters?: number | null
          created_at?: string | null
          last_sync_check?: string | null
          next_chapter_date?: string | null
          next_chapter_number?: number | null
          published_from?: string | null
          published_to?: string | null
          status?: string | null
          title_id: string
          type?: string | null
          updated_at?: string | null
          volumes?: number | null
        }
        Update: {
          chapters?: number | null
          created_at?: string | null
          last_sync_check?: string | null
          next_chapter_date?: string | null
          next_chapter_number?: number | null
          published_from?: string | null
          published_to?: string | null
          status?: string | null
          title_id?: string
          type?: string | null
          updated_at?: string | null
          volumes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manga_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manga_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manga_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manga_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manga_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manga_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manga_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: true
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          body: string
          data: Json | null
          id: string
          sent_at: string | null
          sent_count: number | null
          title: string
          total_subscriptions: number | null
          user_id: string | null
        }
        Insert: {
          body: string
          data?: Json | null
          id?: string
          sent_at?: string | null
          sent_count?: number | null
          title: string
          total_subscriptions?: number | null
          user_id?: string | null
        }
        Update: {
          body?: string
          data?: Json | null
          id?: string
          sent_at?: string | null
          sent_count?: number | null
          title?: string
          total_subscriptions?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      pending_matches: {
        Row: {
          admin_decision: string | null
          confidence_score: number | null
          content_type: string
          created_at: string | null
          id: string
          image_url: string | null
          kitsu_id: number
          potential_matches: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          synopsis: string | null
          title: string
          title_english: string | null
          title_japanese: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          admin_decision?: string | null
          confidence_score?: number | null
          content_type: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          kitsu_id: number
          potential_matches?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          synopsis?: string | null
          title: string
          title_english?: string | null
          title_japanese?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          admin_decision?: string | null
          confidence_score?: number | null
          content_type?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          kitsu_id?: number
          potential_matches?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          synopsis?: string | null
          title?: string
          title_english?: string | null
          title_japanese?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      people: {
        Row: {
          anilist_id: number | null
          biography: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string | null
          death_date: string | null
          id: string
          image_url: string | null
          mal_id: number | null
          name: string
          name_japanese: string | null
          name_romanized: string | null
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          anilist_id?: number | null
          biography?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          death_date?: string | null
          id?: string
          image_url?: string | null
          mal_id?: number | null
          name: string
          name_japanese?: string | null
          name_romanized?: string | null
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          anilist_id?: number | null
          biography?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          death_date?: string | null
          id?: string
          image_url?: string | null
          mal_id?: number | null
          name?: string
          name_japanese?: string | null
          name_romanized?: string | null
          slug?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          name: string
          session_id: string
          tags: Json | null
          timestamp: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          session_id: string
          tags?: Json | null
          timestamp?: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          session_id?: string
          tags?: Json | null
          timestamp?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          full_name: string | null
          id: string
          location: string | null
          role: string | null
          updated_at: string | null
          username: string | null
          verification_required_until: string | null
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
          verification_required_until?: string | null
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
          verification_required_until?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          created_at: string | null
          id: string
          request_count: number | null
          resource_type: string
          updated_at: string | null
          user_id: string
          window_end: string
          window_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          request_count?: number | null
          resource_type: string
          updated_at?: string | null
          user_id: string
          window_end: string
          window_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          request_count?: number | null
          resource_type?: string
          updated_at?: string | null
          user_id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      review_reactions: {
        Row: {
          created_at: string | null
          id: string
          reaction_type: string | null
          review_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reaction_type?: string | null
          review_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reaction_type?: string | null
          review_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_reactions_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          rating: number | null
          spoiler_warning: boolean | null
          title: string | null
          title_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating?: number | null
          spoiler_warning?: boolean | null
          title?: string | null
          title_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating?: number | null
          spoiler_warning?: boolean | null
          title?: string | null
          title_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      score_validations: {
        Row: {
          created_at: string
          id: string
          title_id: string
          updated_at: string
          user_id: string
          validation_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          title_id: string
          updated_at?: string
          user_id: string
          validation_type: string
        }
        Update: {
          created_at?: string
          id?: string
          title_id?: string
          updated_at?: string
          user_id?: string
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_validations_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_validations_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_validations_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_validations_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_validations_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_validations_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_validations_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_health_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          service_name: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          service_name: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          service_name?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      service_metrics: {
        Row: {
          created_at: string | null
          id: number
          metadata: Json | null
          metric_type: string
          metric_value: number
          service_name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          metadata?: Json | null
          metric_type: string
          metric_value: number
          service_name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          service_name?: string
        }
        Relationships: []
      }
      streaming_availability_cache: {
        Row: {
          available: boolean
          created_at: string
          data_source: string
          expires_at: string
          id: string
          last_checked: string
          platforms: Json
          region: string
          title_id: string
          title_name: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          data_source: string
          expires_at: string
          id?: string
          last_checked?: string
          platforms?: Json
          region?: string
          title_id: string
          title_name: string
        }
        Update: {
          available?: boolean
          created_at?: string
          data_source?: string
          expires_at?: string
          id?: string
          last_checked?: string
          platforms?: Json
          region?: string
          title_id?: string
          title_name?: string
        }
        Relationships: []
      }
      studios: {
        Row: {
          anilist_id: number | null
          created_at: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          anilist_id?: number | null
          created_at?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          anilist_id?: number | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      studios_enhanced: {
        Row: {
          created_at: string | null
          description: string | null
          founded_year: number | null
          id: string
          is_animation_studio: boolean | null
          logo_url: string | null
          name: string
          name_japanese: string | null
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          is_animation_studio?: boolean | null
          logo_url?: string | null
          name: string
          name_japanese?: string | null
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          is_animation_studio?: boolean | null
          logo_url?: string | null
          name?: string
          name_japanese?: string | null
          slug?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          content_type: string | null
          created_at: string | null
          error_message: string | null
          id: string
          items_processed: number | null
          operation_type: string | null
          page: number | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          content_type?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          items_processed?: number | null
          operation_type?: string | null
          page?: number | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          content_type?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          items_processed?: number | null
          operation_type?: string | null
          page?: number | null
          status?: string | null
        }
        Relationships: []
      }
      sync_queue: {
        Row: {
          action: string
          created_at: string | null
          data: Json
          id: string
          processed_at: string | null
          retry_count: number | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          data: Json
          id?: string
          processed_at?: string | null
          retry_count?: number | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          data?: Json
          id?: string
          processed_at?: string | null
          retry_count?: number | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          anilist_id: number | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_adult: boolean | null
          is_spoiler: boolean | null
          kitsu_id: number | null
          name: string
          rank: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          anilist_id?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_adult?: boolean | null
          is_spoiler?: boolean | null
          kitsu_id?: number | null
          name: string
          rank?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          anilist_id?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_adult?: boolean | null
          is_spoiler?: boolean | null
          kitsu_id?: number | null
          name?: string
          rank?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      title_authors: {
        Row: {
          author_id: string
          title_id: string
        }
        Insert: {
          author_id: string
          title_id: string
        }
        Update: {
          author_id?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_authors_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_authors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_authors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_authors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_authors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_authors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_authors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_authors_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      title_characters: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          order_index: number | null
          role: string | null
          title_id: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          role?: string | null
          title_id: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          role?: string | null
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      title_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          title_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_comments_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_comments_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_comments_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_comments_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_comments_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_comments_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_comments_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      title_content_characters: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          order_index: number | null
          role: string | null
          title_id: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          role?: string | null
          title_id: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          role?: string | null
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_content_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "content_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_characters_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      title_content_tags: {
        Row: {
          created_at: string | null
          id: string
          is_spoiler: boolean | null
          rank: number | null
          source: string | null
          tag_id: string
          title_id: string
          votes: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_spoiler?: boolean | null
          rank?: number | null
          source?: string | null
          tag_id: string
          title_id: string
          votes?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_spoiler?: boolean | null
          rank?: number | null
          source?: string | null
          tag_id?: string
          title_id?: string
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "title_content_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "content_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_content_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      title_genres: {
        Row: {
          genre_id: string
          title_id: string
        }
        Insert: {
          genre_id: string
          title_id: string
        }
        Update: {
          genre_id?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      title_genres_enhanced: {
        Row: {
          created_at: string | null
          genre_id: string
          id: string
          relevance_score: number | null
          source: string | null
          title_id: string
        }
        Insert: {
          created_at?: string | null
          genre_id: string
          id?: string
          relevance_score?: number | null
          source?: string | null
          title_id: string
        }
        Update: {
          created_at?: string | null
          genre_id?: string
          id?: string
          relevance_score?: number | null
          source?: string | null
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_genres_enhanced_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_enhanced_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "mv_popular_genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_genres_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      title_people: {
        Row: {
          created_at: string | null
          id: string
          is_main_creator: boolean | null
          person_id: string
          role: string
          title_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_main_creator?: boolean | null
          person_id: string
          role: string
          title_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_main_creator?: boolean | null
          person_id?: string
          role?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_people_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_people_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_people_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_people_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_people_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_people_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_people_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      title_studios: {
        Row: {
          studio_id: string
          title_id: string
        }
        Insert: {
          studio_id: string
          title_id: string
        }
        Update: {
          studio_id?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_studios_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      title_studios_enhanced: {
        Row: {
          created_at: string | null
          id: string
          is_main_studio: boolean | null
          role: string | null
          studio_id: string
          title_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_main_studio?: boolean | null
          role?: string | null
          studio_id: string
          title_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_main_studio?: boolean | null
          role?: string | null
          studio_id?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_studios_enhanced_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios_enhanced"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_studios_enhanced_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      title_tags: {
        Row: {
          created_at: string | null
          id: string
          is_spoiler: boolean | null
          rank: number | null
          source: string | null
          tag_id: string
          title_id: string
          votes: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_spoiler?: boolean | null
          rank?: number | null
          source?: string | null
          tag_id: string
          title_id: string
          votes?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_spoiler?: boolean | null
          rank?: number | null
          source?: string | null
          tag_id?: string
          title_id?: string
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "title_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "mv_popular_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          anilist_id: number
          anilist_score: number | null
          color_theme: string | null
          content_type: string | null
          created_at: string | null
          external_links: Json | null
          favorites: number | null
          fts: unknown | null
          id: string
          id_kitsu: number | null
          image_url: string | null
          last_anilist_update: string | null
          last_kitsu_update: string | null
          members: number | null
          num_users_voted: number | null
          popularity: number | null
          rank: number | null
          score: number | null
          synopsis: string | null
          title: string
          title_english: string | null
          title_japanese: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          anilist_id: number
          anilist_score?: number | null
          color_theme?: string | null
          content_type?: string | null
          created_at?: string | null
          external_links?: Json | null
          favorites?: number | null
          fts?: unknown | null
          id?: string
          id_kitsu?: number | null
          image_url?: string | null
          last_anilist_update?: string | null
          last_kitsu_update?: string | null
          members?: number | null
          num_users_voted?: number | null
          popularity?: number | null
          rank?: number | null
          score?: number | null
          synopsis?: string | null
          title: string
          title_english?: string | null
          title_japanese?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          anilist_id?: number
          anilist_score?: number | null
          color_theme?: string | null
          content_type?: string | null
          created_at?: string | null
          external_links?: Json | null
          favorites?: number | null
          fts?: unknown | null
          id?: string
          id_kitsu?: number | null
          image_url?: string | null
          last_anilist_update?: string | null
          last_kitsu_update?: string | null
          members?: number | null
          num_users_voted?: number | null
          popularity?: number | null
          rank?: number | null
          score?: number | null
          synopsis?: string | null
          title?: string
          title_english?: string | null
          title_japanese?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      user_content_preferences: {
        Row: {
          age_verification_date: string | null
          age_verified: boolean | null
          content_rating_preference: string | null
          created_at: string | null
          id: string
          show_adult_content: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          age_verification_date?: string | null
          age_verified?: boolean | null
          content_rating_preference?: string | null
          created_at?: string | null
          id?: string
          show_adult_content?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          age_verification_date?: string | null
          age_verified?: boolean | null
          content_rating_preference?: string | null
          created_at?: string | null
          id?: string
          show_adult_content?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_filter_presets: {
        Row: {
          content_type: string
          created_at: string
          filters: Json
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content_type: string
          created_at?: string
          filters: Json
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Relationships: []
      }
      user_loot_boxes: {
        Row: {
          box_type: string
          created_at: string | null
          id: string
          quantity: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          box_type: string
          created_at?: string | null
          id?: string
          quantity?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          box_type?: string
          created_at?: string | null
          id?: string
          quantity?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_loot_boxes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_user_statistics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_loot_boxes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string
          daily_points: number
          first_loot_box_opened: boolean
          id: string
          last_login_date: string | null
          login_streak: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_points?: number
          first_loot_box_opened?: boolean
          id?: string
          last_login_date?: string | null
          login_streak?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_points?: number
          first_loot_box_opened?: boolean
          id?: string
          last_login_date?: string | null
          login_streak?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_add_sequels: boolean | null
          created_at: string | null
          excluded_genres: string[] | null
          id: string
          list_visibility: string | null
          notification_settings: Json | null
          preferred_genres: string[] | null
          privacy_level: string | null
          show_adult_content: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_add_sequels?: boolean | null
          created_at?: string | null
          excluded_genres?: string[] | null
          id?: string
          list_visibility?: string | null
          notification_settings?: Json | null
          preferred_genres?: string[] | null
          privacy_level?: string | null
          show_adult_content?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_add_sequels?: boolean | null
          created_at?: string | null
          excluded_genres?: string[] | null
          id?: string
          list_visibility?: string | null
          notification_settings?: Json | null
          preferred_genres?: string[] | null
          privacy_level?: string | null
          show_adult_content?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_title_lists: {
        Row: {
          chapters_read: number | null
          created_at: string | null
          episodes_watched: number | null
          finish_date: string | null
          id: string
          media_type: string
          notes: string | null
          score: number | null
          start_date: string | null
          status_id: string
          title_id: string
          updated_at: string | null
          user_id: string
          volumes_read: number | null
        }
        Insert: {
          chapters_read?: number | null
          created_at?: string | null
          episodes_watched?: number | null
          finish_date?: string | null
          id?: string
          media_type: string
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status_id: string
          title_id: string
          updated_at?: string | null
          user_id: string
          volumes_read?: number | null
        }
        Update: {
          chapters_read?: number | null
          created_at?: string | null
          episodes_watched?: number | null
          finish_date?: string | null
          id?: string
          media_type?: string
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status_id?: string
          title_id?: string
          updated_at?: string | null
          user_id?: string
          volumes_read?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_title_lists_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "list_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_lists_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_lists_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_lists_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_lists_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_lists_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_lists_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_lists_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_user_statistics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_title_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_title_progress: {
        Row: {
          current_chapter: number | null
          current_episode: number | null
          id: string
          last_updated: string | null
          title_id: string | null
          user_id: string | null
        }
        Insert: {
          current_chapter?: number | null
          current_episode?: number | null
          id?: string
          last_updated?: string | null
          title_id?: string | null
          user_id?: string | null
        }
        Update: {
          current_chapter?: number | null
          current_episode?: number | null
          id?: string
          last_updated?: string | null
          title_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_title_progress_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "anime_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_progress_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_airing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_progress_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_currently_publishing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_progress_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_progress_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_progress_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_title_progress_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "v_trending_manga"
            referencedColumns: ["id"]
          },
        ]
      }
      username_history: {
        Row: {
          acquired_at: string | null
          acquired_method: string | null
          id: string
          is_current: boolean | null
          tier: Database["public"]["Enums"]["username_tier"]
          user_id: string | null
          username: string
        }
        Insert: {
          acquired_at?: string | null
          acquired_method?: string | null
          id?: string
          is_current?: boolean | null
          tier: Database["public"]["Enums"]["username_tier"]
          user_id?: string | null
          username: string
        }
        Update: {
          acquired_at?: string | null
          acquired_method?: string | null
          id?: string
          is_current?: boolean | null
          tier?: Database["public"]["Enums"]["username_tier"]
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "username_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_user_statistics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "username_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      username_pool: {
        Row: {
          character_description: string | null
          character_personality: string | null
          character_type: string | null
          created_at: string | null
          id: string
          name: string
          source_anime: string | null
          tier: Database["public"]["Enums"]["username_tier"]
        }
        Insert: {
          character_description?: string | null
          character_personality?: string | null
          character_type?: string | null
          created_at?: string | null
          id?: string
          name: string
          source_anime?: string | null
          tier: Database["public"]["Enums"]["username_tier"]
        }
        Update: {
          character_description?: string | null
          character_personality?: string | null
          character_type?: string | null
          created_at?: string | null
          id?: string
          name?: string
          source_anime?: string | null
          tier?: Database["public"]["Enums"]["username_tier"]
        }
        Relationships: []
      }
    }
    Views: {
      anime_catalog: {
        Row: {
          episodes: number | null
          id: string | null
          image_url: string | null
          score: number | null
          status: string | null
          title: string | null
          title_english: string | null
          type: string | null
        }
        Relationships: []
      }
      edge_function_dashboard: {
        Row: {
          cron_active: boolean | null
          failed_tests: number | null
          function_name: string | null
          health_status: string | null
          last_tested: string | null
          schedule: string | null
          successful_tests: number | null
          total_tests: number | null
        }
        Relationships: []
      }
      mv_currently_airing: {
        Row: {
          aired_from: string | null
          aired_to: string | null
          anilist_id: number | null
          anilist_score: number | null
          calculated_season: string | null
          color_theme: string | null
          created_at: string | null
          episodes: number | null
          episodes_aired: number | null
          favorites: number | null
          id: string | null
          image_url: string | null
          next_episode_date: string | null
          next_episode_number: number | null
          popularity: number | null
          rank: number | null
          score: number | null
          season: string | null
          status: string | null
          status_indicator: string | null
          synopsis: string | null
          title: string | null
          title_english: string | null
          title_japanese: string | null
          trending_score: number | null
          type: string | null
          updated_at: string | null
          year: number | null
        }
        Relationships: []
      }
      mv_currently_publishing: {
        Row: {
          anilist_id: number | null
          anilist_score: number | null
          chapters: number | null
          color_theme: string | null
          created_at: string | null
          favorites: number | null
          id: string | null
          image_url: string | null
          next_chapter_date: string | null
          next_chapter_number: number | null
          popularity: number | null
          published_from: string | null
          published_to: string | null
          rank: number | null
          score: number | null
          status: string | null
          status_indicator: string | null
          synopsis: string | null
          title: string | null
          title_english: string | null
          title_japanese: string | null
          trending_score: number | null
          type: string | null
          updated_at: string | null
          volumes: number | null
          year: number | null
        }
        Relationships: []
      }
      mv_popular_genres: {
        Row: {
          avg_relevance: number | null
          category: string | null
          id: string | null
          name: string | null
          slug: string | null
          title_count: number | null
        }
        Relationships: []
      }
      mv_popular_tags: {
        Row: {
          avg_rank: number | null
          category: string | null
          id: string | null
          name: string | null
          slug: string | null
          total_votes: number | null
          usage_count: number | null
        }
        Relationships: []
      }
      mv_trending_content: {
        Row: {
          anilist_id: number | null
          anilist_score: number | null
          color_theme: string | null
          content_type: string | null
          created_at: string | null
          genres: string[] | null
          id: string | null
          image_url: string | null
          list_count: number | null
          popularity: number | null
          progress_count: number | null
          rank: number | null
          status: string | null
          synopsis: string | null
          title: string | null
          title_english: string | null
          title_japanese: string | null
          trending_score: number | null
          updated_at: string | null
          verified_content_type: string | null
          year: number | null
        }
        Relationships: []
      }
      mv_user_statistics: {
        Row: {
          anime_count: number | null
          full_name: string | null
          last_activity: string | null
          manga_count: number | null
          mean_score: number | null
          scored_entries: number | null
          total_entries: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_trending_anime: {
        Row: {
          aired_from: string | null
          aired_to: string | null
          airing_priority: number | null
          anilist_id: number | null
          anilist_score: number | null
          color_theme: string | null
          created_at: string | null
          episodes: number | null
          id: string | null
          image_url: string | null
          next_episode_date: string | null
          popularity: number | null
          rank: number | null
          score: number | null
          season: string | null
          status: string | null
          synopsis: string | null
          title: string | null
          title_english: string | null
          title_japanese: string | null
          trending_score: number | null
          type: string | null
          updated_at: string | null
          year: number | null
        }
        Relationships: []
      }
      v_trending_manga: {
        Row: {
          anilist_id: number | null
          anilist_score: number | null
          chapters: number | null
          color_theme: string | null
          created_at: string | null
          id: string | null
          image_url: string | null
          popularity: number | null
          published_from: string | null
          published_to: string | null
          rank: number | null
          score: number | null
          status: string | null
          synopsis: string | null
          title: string | null
          title_english: string | null
          title_japanese: string | null
          trending_score: number | null
          type: string | null
          updated_at: string | null
          volumes: number | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_to_dead_letter_queue: {
        Args: {
          operation_type_param: string
          payload_param: Json
          error_message_param: string
          max_retries_param?: number
        }
        Returns: string
      }
      archive_old_cron_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      assign_random_username: {
        Args: { user_id_param: string }
        Returns: {
          username: string
          tier: Database["public"]["Enums"]["username_tier"]
        }[]
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      check_auth_rate_limit: {
        Args: { user_ip: string; action_type: string }
        Returns: Json
      }
      check_email_system_alerts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_email_verification_status: {
        Args: { user_id_param: string }
        Returns: {
          is_verified: boolean
          verification_status: string
          days_remaining: number
          verification_expires_at: string
        }[]
      }
      check_rate_limit: {
        Args: {
          user_id_param: string
          resource_type_param: string
          max_requests?: number
          window_minutes?: number
        }
        Returns: Json
      }
      check_verification_expiry: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_streaming_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_archives: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_monthly_partition: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_fuzzy_title_matches: {
        Args: {
          search_title: string
          search_title_english?: string
          search_title_japanese?: string
          content_type_filter?: string
          limit_results?: number
          min_similarity?: number
        }
        Returns: {
          title_id: string
          title: string
          title_english: string
          title_japanese: string
          content_type: string
          similarity_score: number
        }[]
      }
      get_anime_count: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_anime_detail: {
        Args: { anime_id_param: string }
        Returns: {
          id: string
          anilist_id: number
          title: string
          title_english: string
          title_japanese: string
          synopsis: string
          image_url: string
          score: number
          anilist_score: number
          rank: number
          popularity: number
          num_users_voted: number
          year: number
          color_theme: string
          created_at: string
          updated_at: string
          episodes: number
          aired_from: string
          aired_to: string
          season: string
          status: string
          type: string
          trailer_url: string
          trailer_site: string
          trailer_id: string
          next_episode_date: string
          next_episode_number: number
          last_sync_check: string
          genres: Json
          studios: Json
        }[]
      }
      get_archive_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_archived: number
          oldest_log: string
          newest_log: string
          jobs_by_status: Json
        }[]
      }
      get_manga_detail: {
        Args: { manga_id_param: string }
        Returns: {
          id: string
          anilist_id: number
          title: string
          title_english: string
          title_japanese: string
          synopsis: string
          image_url: string
          score: number
          anilist_score: number
          rank: number
          popularity: number
          num_users_voted: number
          year: number
          color_theme: string
          created_at: string
          updated_at: string
          chapters: number
          volumes: number
          published_from: string
          published_to: string
          status: string
          type: string
          next_chapter_date: string
          next_chapter_number: number
          last_sync_check: string
          genres: Json
          authors: Json
        }[]
      }
      get_recent_anime: {
        Args: { limit_param?: number }
        Returns: {
          id: string
          anilist_id: number
          title: string
          title_english: string
          title_japanese: string
          synopsis: string
          image_url: string
          score: number
          anilist_score: number
          rank: number
          popularity: number
          year: number
          color_theme: string
          created_at: string
          updated_at: string
          episodes: number
          aired_from: string
          aired_to: string
          season: string
          status: string
          type: string
          trailer_url: string
          trailer_site: string
          trailer_id: string
          next_episode_date: string
          next_episode_number: number
          last_sync_check: string
          genres: Json
          studios: Json
        }[]
      }
      get_recent_manga: {
        Args: { limit_param?: number }
        Returns: {
          id: string
          anilist_id: number
          title: string
          title_english: string
          title_japanese: string
          synopsis: string
          image_url: string
          score: number
          anilist_score: number
          rank: number
          popularity: number
          year: number
          color_theme: string
          created_at: string
          updated_at: string
          chapters: number
          volumes: number
          published_from: string
          published_to: string
          status: string
          type: string
          next_chapter_date: string
          next_chapter_number: number
          last_sync_check: string
          genres: Json
          authors: Json
        }[]
      }
      get_related_titles: {
        Args: {
          title_id_param: string
          content_type: string
          limit_param?: number
        }
        Returns: {
          id: string
          title: string
          image_url: string
          score: number
          anilist_id: number
        }[]
      }
      get_title_metadata: {
        Args: { title_id_param: string }
        Returns: Json
      }
      get_title_validation_stats: {
        Args: { title_id_param: string }
        Returns: {
          validation_type: string
          count: number
          percentage: number
        }[]
      }
      get_trending_anime: {
        Args: { limit_param?: number }
        Returns: {
          id: string
          anilist_id: number
          title: string
          title_english: string
          title_japanese: string
          synopsis: string
          image_url: string
          score: number
          anilist_score: number
          rank: number
          popularity: number
          year: number
          color_theme: string
          created_at: string
          updated_at: string
          episodes: number
          aired_from: string
          aired_to: string
          season: string
          status: string
          type: string
          trailer_url: string
          trailer_site: string
          trailer_id: string
          next_episode_date: string
          next_episode_number: number
          last_sync_check: string
          genres: Json
          studios: Json
        }[]
      }
      get_trending_manga: {
        Args: { limit_param?: number }
        Returns: {
          id: string
          anilist_id: number
          title: string
          title_english: string
          title_japanese: string
          synopsis: string
          image_url: string
          score: number
          anilist_score: number
          rank: number
          popularity: number
          year: number
          color_theme: string
          created_at: string
          updated_at: string
          chapters: number
          volumes: number
          published_from: string
          published_to: string
          status: string
          type: string
          next_chapter_date: string
          next_chapter_number: number
          last_sync_check: string
          genres: Json
          authors: Json
        }[]
      }
      get_user_gamification_summary: {
        Args: { user_id_param: string }
        Returns: {
          login_streak: number
          current_username: string
          username_tier: string
          loot_boxes: Json
          recent_activities: Json
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      initialize_user_atomic: {
        Args: { user_id_param: string }
        Returns: {
          success: boolean
          username: string
          tier: string
          is_first_time: boolean
          needs_welcome: boolean
          message: string
        }[]
      }
      initialize_user_gamification: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      insert_title_with_details: {
        Args: {
          title_data: Json
          anime_data?: Json
          manga_data?: Json
          genre_names?: string[]
          studio_names?: string[]
          author_names?: string[]
        }
        Returns: string
      }
      log_cache_performance: {
        Args: {
          metric_type_param: string
          metric_value_param: number
          cache_key_param?: string
          metadata_param?: Json
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          user_id_param: string
          event_type_param: string
          event_data_param?: Json
          severity_param?: string
        }
        Returns: undefined
      }
      log_service_metric: {
        Args: {
          service_name_param: string
          metric_type_param: string
          metric_value_param: number
          metadata_param: Json
        }
        Returns: undefined
      }
      open_loot_box_secure: {
        Args: { user_id_param: string; box_type_param: string }
        Returns: {
          username: string
          tier: string
          source_anime: string
          description: string
          personality: string
          is_first_time: boolean
          server_seed: string
          random_value: number
        }[]
      }
      process_auth_webhook: {
        Args: { event_type: string; user_data: Json }
        Returns: Json
      }
      refresh_trending_content: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_trending_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      resend_verification_email: {
        Args: { user_id_param: string }
        Returns: Json
      }
      safe_date_cast: {
        Args: { date_string: string }
        Returns: string
      }
      safe_refresh_materialized_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_titles_by_metadata: {
        Args: {
          genre_slugs?: string[]
          tag_slugs?: string[]
          studio_slugs?: string[]
          creator_slugs?: string[]
          content_type_filter?: string
          limit_results?: number
        }
        Returns: {
          id: string
          title: string
          title_english: string
          title_japanese: string
          synopsis: string
          image_url: string
          score: number
          year: number
          content_type: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      set_service_key: {
        Args: { key_value: string }
        Returns: undefined
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      test_sync_connectivity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      verify_user_email: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      warm_cache_manually: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      username_tier:
        | "GOD"
        | "LEGENDARY"
        | "EPIC"
        | "RARE"
        | "UNCOMMON"
        | "COMMON"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      username_tier: ["GOD", "LEGENDARY", "EPIC", "RARE", "UNCOMMON", "COMMON"],
    },
  },
} as const
