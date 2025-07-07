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
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          anime_id?: string | null
          created_at?: string | null
          id?: string
          manga_id?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          anime_id?: string | null
          created_at?: string | null
          id?: string
          manga_id?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      anime: {
        Row: {
          aired_from: string | null
          aired_to: string | null
          airing_schedule: Json | null
          anilist_id: number | null
          anilist_score: number | null
          banner_image: string | null
          characters_data: Json | null
          color_theme: string | null
          cover_image_extra_large: string | null
          cover_image_large: string | null
          created_at: string | null
          demographics: string[] | null
          detailed_tags: Json | null
          episodes: number | null
          external_links: Json | null
          favorites: number | null
          genres: string[] | null
          id: string
          image_url: string | null
          last_sync_check: string | null
          mal_id: number | null
          members: number | null
          next_episode_date: string | null
          next_episode_number: number | null
          popularity: number | null
          rank: number | null
          recommendations_data: Json | null
          relations_data: Json | null
          score: number | null
          scored_by: number | null
          season: string | null
          staff_data: Json | null
          status: string | null
          streaming_episodes: Json | null
          studios: string[] | null
          studios_data: Json | null
          synopsis: string | null
          themes: string[] | null
          title: string
          title_english: string | null
          title_japanese: string | null
          tmdb_backdrop_path: string | null
          tmdb_cast_data: Json | null
          tmdb_crew_data: Json | null
          tmdb_details: Json | null
          tmdb_genre_ids: number[] | null
          tmdb_id: number | null
          tmdb_overview: string | null
          tmdb_popularity: number | null
          tmdb_poster_path: string | null
          tmdb_type: string | null
          tmdb_vote_average: number | null
          tmdb_vote_count: number | null
          trailer_id: string | null
          trailer_site: string | null
          trailer_url: string | null
          type: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          aired_from?: string | null
          aired_to?: string | null
          airing_schedule?: Json | null
          anilist_id?: number | null
          anilist_score?: number | null
          banner_image?: string | null
          characters_data?: Json | null
          color_theme?: string | null
          cover_image_extra_large?: string | null
          cover_image_large?: string | null
          created_at?: string | null
          demographics?: string[] | null
          detailed_tags?: Json | null
          episodes?: number | null
          external_links?: Json | null
          favorites?: number | null
          genres?: string[] | null
          id?: string
          image_url?: string | null
          last_sync_check?: string | null
          mal_id?: number | null
          members?: number | null
          next_episode_date?: string | null
          next_episode_number?: number | null
          popularity?: number | null
          rank?: number | null
          recommendations_data?: Json | null
          relations_data?: Json | null
          score?: number | null
          scored_by?: number | null
          season?: string | null
          staff_data?: Json | null
          status?: string | null
          streaming_episodes?: Json | null
          studios?: string[] | null
          studios_data?: Json | null
          synopsis?: string | null
          themes?: string[] | null
          title: string
          title_english?: string | null
          title_japanese?: string | null
          tmdb_backdrop_path?: string | null
          tmdb_cast_data?: Json | null
          tmdb_crew_data?: Json | null
          tmdb_details?: Json | null
          tmdb_genre_ids?: number[] | null
          tmdb_id?: number | null
          tmdb_overview?: string | null
          tmdb_popularity?: number | null
          tmdb_poster_path?: string | null
          tmdb_type?: string | null
          tmdb_vote_average?: number | null
          tmdb_vote_count?: number | null
          trailer_id?: string | null
          trailer_site?: string | null
          trailer_url?: string | null
          type?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          aired_from?: string | null
          aired_to?: string | null
          airing_schedule?: Json | null
          anilist_id?: number | null
          anilist_score?: number | null
          banner_image?: string | null
          characters_data?: Json | null
          color_theme?: string | null
          cover_image_extra_large?: string | null
          cover_image_large?: string | null
          created_at?: string | null
          demographics?: string[] | null
          detailed_tags?: Json | null
          episodes?: number | null
          external_links?: Json | null
          favorites?: number | null
          genres?: string[] | null
          id?: string
          image_url?: string | null
          last_sync_check?: string | null
          mal_id?: number | null
          members?: number | null
          next_episode_date?: string | null
          next_episode_number?: number | null
          popularity?: number | null
          rank?: number | null
          recommendations_data?: Json | null
          relations_data?: Json | null
          score?: number | null
          scored_by?: number | null
          season?: string | null
          staff_data?: Json | null
          status?: string | null
          streaming_episodes?: Json | null
          studios?: string[] | null
          studios_data?: Json | null
          synopsis?: string | null
          themes?: string[] | null
          title?: string
          title_english?: string | null
          title_japanese?: string | null
          tmdb_backdrop_path?: string | null
          tmdb_cast_data?: Json | null
          tmdb_crew_data?: Json | null
          tmdb_details?: Json | null
          tmdb_genre_ids?: number[] | null
          tmdb_id?: number | null
          tmdb_overview?: string | null
          tmdb_popularity?: number | null
          tmdb_poster_path?: string | null
          tmdb_type?: string | null
          tmdb_vote_average?: number | null
          tmdb_vote_count?: number | null
          trailer_id?: string | null
          trailer_site?: string | null
          trailer_url?: string | null
          type?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
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
      manga: {
        Row: {
          anilist_id: number | null
          authors: string[] | null
          chapters: number | null
          created_at: string | null
          demographics: string[] | null
          favorites: number | null
          genres: string[] | null
          id: string
          image_url: string | null
          last_sync_check: string | null
          mal_id: number | null
          members: number | null
          next_chapter_date: string | null
          next_chapter_number: number | null
          popularity: number | null
          published_from: string | null
          published_to: string | null
          rank: number | null
          release_schedule: Json | null
          score: number | null
          scored_by: number | null
          serializations: string[] | null
          status: string | null
          synopsis: string | null
          themes: string[] | null
          title: string
          title_english: string | null
          title_japanese: string | null
          type: string | null
          updated_at: string | null
          volumes: number | null
        }
        Insert: {
          anilist_id?: number | null
          authors?: string[] | null
          chapters?: number | null
          created_at?: string | null
          demographics?: string[] | null
          favorites?: number | null
          genres?: string[] | null
          id?: string
          image_url?: string | null
          last_sync_check?: string | null
          mal_id?: number | null
          members?: number | null
          next_chapter_date?: string | null
          next_chapter_number?: number | null
          popularity?: number | null
          published_from?: string | null
          published_to?: string | null
          rank?: number | null
          release_schedule?: Json | null
          score?: number | null
          scored_by?: number | null
          serializations?: string[] | null
          status?: string | null
          synopsis?: string | null
          themes?: string[] | null
          title: string
          title_english?: string | null
          title_japanese?: string | null
          type?: string | null
          updated_at?: string | null
          volumes?: number | null
        }
        Update: {
          anilist_id?: number | null
          authors?: string[] | null
          chapters?: number | null
          created_at?: string | null
          demographics?: string[] | null
          favorites?: number | null
          genres?: string[] | null
          id?: string
          image_url?: string | null
          last_sync_check?: string | null
          mal_id?: number | null
          members?: number | null
          next_chapter_date?: string | null
          next_chapter_number?: number | null
          popularity?: number | null
          published_from?: string | null
          published_to?: string | null
          rank?: number | null
          release_schedule?: Json | null
          score?: number | null
          scored_by?: number | null
          serializations?: string[] | null
          status?: string | null
          synopsis?: string | null
          themes?: string[] | null
          title?: string
          title_english?: string | null
          title_japanese?: string | null
          type?: string | null
          updated_at?: string | null
          volumes?: number | null
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
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
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
      user_anime_lists: {
        Row: {
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
        Relationships: [
          {
            foreignKeyName: "user_anime_lists_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
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
          manga_id?: string | null
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          volumes_read?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_manga_lists_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
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
      anime_stats: {
        Row: {
          average_score: number | null
          current_year_anime: number | null
          currently_airing: number | null
          finished_airing: number | null
          total_anime: number | null
        }
        Relationships: []
      }
      manga_stats: {
        Row: {
          average_score: number | null
          currently_publishing: number | null
          finished_manga: number | null
          total_manga: number | null
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
