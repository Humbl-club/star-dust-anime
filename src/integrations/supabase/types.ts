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
          id: string
          last_sync_check: string | null
          next_episode_date: string | null
          next_episode_number: number | null
          season: string | null
          status: string | null
          title_id: string | null
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
          id?: string
          last_sync_check?: string | null
          next_episode_date?: string | null
          next_episode_number?: number | null
          season?: string | null
          status?: string | null
          title_id?: string | null
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
          id?: string
          last_sync_check?: string | null
          next_episode_date?: string | null
          next_episode_number?: number | null
          season?: string | null
          status?: string | null
          title_id?: string | null
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
            isOneToOne: false
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
      cleanup_audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          operation_phase: string
          operation_timestamp: string | null
          records_affected: number | null
          records_after: number | null
          records_before: number | null
          table_name: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          operation_phase: string
          operation_timestamp?: string | null
          records_affected?: number | null
          records_after?: number | null
          records_before?: number | null
          table_name: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          operation_phase?: string
          operation_timestamp?: string | null
          records_affected?: number | null
          records_after?: number | null
          records_before?: number | null
          table_name?: string
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
      manga_details: {
        Row: {
          chapters: number | null
          created_at: string | null
          id: string
          last_sync_check: string | null
          next_chapter_date: string | null
          next_chapter_number: number | null
          published_from: string | null
          published_to: string | null
          status: string | null
          title_id: string | null
          type: string | null
          updated_at: string | null
          volumes: number | null
        }
        Insert: {
          chapters?: number | null
          created_at?: string | null
          id?: string
          last_sync_check?: string | null
          next_chapter_date?: string | null
          next_chapter_number?: number | null
          published_from?: string | null
          published_to?: string | null
          status?: string | null
          title_id?: string | null
          type?: string | null
          updated_at?: string | null
          volumes?: number | null
        }
        Update: {
          chapters?: number | null
          created_at?: string | null
          id?: string
          last_sync_check?: string | null
          next_chapter_date?: string | null
          next_chapter_number?: number | null
          published_from?: string | null
          published_to?: string | null
          status?: string | null
          title_id?: string | null
          type?: string | null
          updated_at?: string | null
          volumes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manga_details_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
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
          anime_id: string | null
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          manga_id: string | null
          rating: number | null
          spoiler_warning: boolean | null
          title: string | null
          title_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anime_id?: string | null
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          manga_id?: string | null
          rating?: number | null
          spoiler_warning?: boolean | null
          title?: string | null
          title_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anime_id?: string | null
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          manga_id?: string | null
          rating?: number | null
          spoiler_warning?: boolean | null
          title?: string | null
          title_id?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          members: number | null
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
          members?: number | null
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
          members?: number | null
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
      user_anime_lists: {
        Row: {
          anime_detail_id: string | null
          anime_id: string | null
          created_at: string | null
          episodes_watched: number | null
          finish_date: string | null
          id: string
          notes: string | null
          score: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anime_detail_id?: string | null
          anime_id?: string | null
          created_at?: string | null
          episodes_watched?: number | null
          finish_date?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anime_detail_id?: string | null
          anime_id?: string | null
          created_at?: string | null
          episodes_watched?: number | null
          finish_date?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      user_manga_lists: {
        Row: {
          chapters_read: number | null
          created_at: string | null
          finish_date: string | null
          id: string
          manga_detail_id: string | null
          manga_id: string | null
          notes: string | null
          score: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          volumes_read: number | null
        }
        Insert: {
          chapters_read?: number | null
          created_at?: string | null
          finish_date?: string | null
          id?: string
          manga_detail_id?: string | null
          manga_id?: string | null
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          volumes_read?: number | null
        }
        Update: {
          chapters_read?: number | null
          created_at?: string | null
          finish_date?: string | null
          id?: string
          manga_detail_id?: string | null
          manga_id?: string | null
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          volumes_read?: number | null
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
    }
    Views: {
      phase_1_cleanup_summary: {
        Row: {
          action: string | null
          details: Json | null
          operation_timestamp: string | null
          records_affected: number | null
          records_after: number | null
          records_before: number | null
          table_name: string | null
        }
        Insert: {
          action?: string | null
          details?: Json | null
          operation_timestamp?: string | null
          records_affected?: number | null
          records_after?: number | null
          records_before?: number | null
          table_name?: string | null
        }
        Update: {
          action?: string | null
          details?: Json | null
          operation_timestamp?: string | null
          records_affected?: number | null
          records_after?: number | null
          records_before?: number | null
          table_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      safe_date_cast: {
        Args: { date_string: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
