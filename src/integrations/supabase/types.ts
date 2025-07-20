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
            referencedRelation: "titles"
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
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
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
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "titles"
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
      studios: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
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
            referencedRelation: "titles"
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
            referencedRelation: "titles"
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
            referencedRelation: "titles"
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
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          anilist_id: number
          anilist_score: number | null
          color_theme: string | null
          created_at: string | null
          favorites: number | null
          id: string
          image_url: string | null
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
          created_at?: string | null
          favorites?: number | null
          id?: string
          image_url?: string | null
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
          created_at?: string | null
          favorites?: number | null
          id?: string
          image_url?: string | null
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
            referencedRelation: "titles"
            referencedColumns: ["id"]
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
            referencedRelation: "titles"
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
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      get_title_validation_stats: {
        Args: { title_id_param: string }
        Returns: {
          validation_type: string
          count: number
          percentage: number
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
      resend_verification_email: {
        Args: { user_id_param: string }
        Returns: Json
      }
      safe_date_cast: {
        Args: { date_string: string }
        Returns: string
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
