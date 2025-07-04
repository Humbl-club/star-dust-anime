export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_data: {
        Row: {
          active_minutes: number | null
          calories_burned: number | null
          created_at: string | null
          date: string
          distance: number | null
          id: string
          steps: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_minutes?: number | null
          calories_burned?: number | null
          created_at?: string | null
          date: string
          distance?: number | null
          id?: string
          steps?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_minutes?: number | null
          calories_burned?: number | null
          created_at?: string | null
          date?: string
          distance?: number | null
          id?: string
          steps?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_feed: {
        Row: {
          activity_type: string
          anime_id: string | null
          created_at: string
          id: string
          manga_id: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          anime_id?: string | null
          created_at?: string
          id?: string
          manga_id?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          anime_id?: string | null
          created_at?: string
          id?: string
          manga_id?: string | null
          metadata?: Json | null
          user_id?: string
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
          created_at: string
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
          trailer_id: string | null
          trailer_site: string | null
          trailer_url: string | null
          type: string | null
          updated_at: string
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
          created_at?: string
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
          trailer_id?: string | null
          trailer_site?: string | null
          trailer_url?: string | null
          type?: string | null
          updated_at?: string
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
          created_at?: string
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
          trailer_id?: string | null
          trailer_site?: string | null
          trailer_url?: string | null
          type?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      anime_detailed_stats: {
        Row: {
          age_demographics: Json | null
          anime_id: string
          completed_count: number | null
          country_demographics: Json | null
          created_at: string
          dropped_count: number | null
          gender_demographics: Json | null
          id: string
          on_hold_count: number | null
          plan_to_watch_count: number | null
          score_distribution: Json | null
          seasonal_popularity: Json | null
          updated_at: string
          watching_count: number | null
        }
        Insert: {
          age_demographics?: Json | null
          anime_id: string
          completed_count?: number | null
          country_demographics?: Json | null
          created_at?: string
          dropped_count?: number | null
          gender_demographics?: Json | null
          id?: string
          on_hold_count?: number | null
          plan_to_watch_count?: number | null
          score_distribution?: Json | null
          seasonal_popularity?: Json | null
          updated_at?: string
          watching_count?: number | null
        }
        Update: {
          age_demographics?: Json | null
          anime_id?: string
          completed_count?: number | null
          country_demographics?: Json | null
          created_at?: string
          dropped_count?: number | null
          gender_demographics?: Json | null
          id?: string
          on_hold_count?: number | null
          plan_to_watch_count?: number | null
          score_distribution?: Json | null
          seasonal_popularity?: Json | null
          updated_at?: string
          watching_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anime_detailed_stats_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: true
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
        ]
      }
      api_attributions: {
        Row: {
          attribution_text: string
          created_at: string
          id: string
          is_active: boolean
          license_url: string | null
          privacy_url: string | null
          service_name: string
          terms_url: string | null
        }
        Insert: {
          attribution_text: string
          created_at?: string
          id?: string
          is_active?: boolean
          license_url?: string | null
          privacy_url?: string | null
          service_name: string
          terms_url?: string | null
        }
        Update: {
          attribution_text?: string
          created_at?: string
          id?: string
          is_active?: boolean
          license_url?: string | null
          privacy_url?: string | null
          service_name?: string
          terms_url?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          is_attending: boolean | null
          location: string | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          is_attending?: boolean | null
          location?: string | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          is_attending?: boolean | null
          location?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          created_at: string | null
          id: string
          steps: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          id?: string
          steps?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          id?: string
          steps?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string
          goal: number | null
          id: string
          start_date: string
          title: string
          type: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date: string
          goal?: number | null
          id?: string
          start_date: string
          title: string
          type?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string
          goal?: number | null
          id?: string
          start_date?: string
          title?: string
          type?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          moderator_notes: string | null
          report_reason: string
          reported_content_id: string
          reported_content_type: string
          reporter_user_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          moderator_notes?: string | null
          report_reason: string
          reported_content_id: string
          reported_content_type: string
          reporter_user_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          moderator_notes?: string | null
          report_reason?: string
          reported_content_id?: string
          reported_content_type?: string
          reporter_user_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      content_sync_status: {
        Row: {
          completed_at: string | null
          content_type: string
          current_page: number | null
          error_message: string | null
          id: string
          next_run_at: string | null
          operation_type: string
          processed_items: number | null
          started_at: string | null
          status: string
          total_items: number | null
        }
        Insert: {
          completed_at?: string | null
          content_type: string
          current_page?: number | null
          error_message?: string | null
          id?: string
          next_run_at?: string | null
          operation_type: string
          processed_items?: number | null
          started_at?: string | null
          status?: string
          total_items?: number | null
        }
        Update: {
          completed_at?: string | null
          content_type?: string
          current_page?: number | null
          error_message?: string | null
          id?: string
          next_run_at?: string | null
          operation_type?: string
          processed_items?: number | null
          started_at?: string | null
          status?: string
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
      curated_list_items: {
        Row: {
          anime_id: string | null
          created_at: string
          curator_note: string | null
          id: string
          list_id: string
          manga_id: string | null
          position: number
        }
        Insert: {
          anime_id?: string | null
          created_at?: string
          curator_note?: string | null
          id?: string
          list_id: string
          manga_id?: string | null
          position: number
        }
        Update: {
          anime_id?: string | null
          created_at?: string
          curator_note?: string | null
          id?: string
          list_id?: string
          manga_id?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "curated_list_items_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curated_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "curated_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curated_list_items_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      curated_lists: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          follower_count: number | null
          id: string
          influencer_id: string
          is_public: boolean | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number | null
          id?: string
          influencer_id: string
          is_public?: boolean | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number | null
          id?: string
          influencer_id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "curated_lists_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          content: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          likes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          likes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          likes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_export_logs: {
        Row: {
          created_at: string
          error_message: string | null
          file_url: string | null
          id: string
          items_processed: number | null
          items_total: number | null
          operation_type: string
          source_platform: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          id?: string
          items_processed?: number | null
          items_total?: number | null
          operation_type: string
          source_platform?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          id?: string
          items_processed?: number | null
          items_total?: number | null
          operation_type?: string
          source_platform?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      influencer_follows: {
        Row: {
          created_at: string
          id: string
          influencer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          influencer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          influencer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_follows_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          follower_count: number | null
          id: string
          instagram_handle: string | null
          specialty_genres: string[] | null
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
          youtube_channel: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          follower_count?: number | null
          id?: string
          instagram_handle?: string | null
          specialty_genres?: string[] | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          youtube_channel?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          follower_count?: number | null
          id?: string
          instagram_handle?: string | null
          specialty_genres?: string[] | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          youtube_channel?: string | null
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          content: string
          effective_date: string
          id: string
          last_updated: string
          page_type: string
          title: string
          version: string
        }
        Insert: {
          content: string
          effective_date?: string
          id?: string
          last_updated?: string
          page_type: string
          title: string
          version?: string
        }
        Update: {
          content?: string
          effective_date?: string
          id?: string
          last_updated?: string
          page_type?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      list_follows: {
        Row: {
          created_at: string
          id: string
          list_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_follows_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "curated_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      manga: {
        Row: {
          anilist_id: number | null
          authors: string[] | null
          chapters: number | null
          created_at: string
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
          updated_at: string
          volumes: number | null
        }
        Insert: {
          anilist_id?: number | null
          authors?: string[] | null
          chapters?: number | null
          created_at?: string
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
          updated_at?: string
          volumes?: number | null
        }
        Update: {
          anilist_id?: number | null
          authors?: string[] | null
          chapters?: number | null
          created_at?: string
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
          updated_at?: string
          volumes?: number | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          full_name: string | null
          id: string
          instagram_handle: string | null
          location: string | null
          role: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          instagram_handle?: string | null
          location?: string | null
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          location?: string | null
          role?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          anime_id: string | null
          confidence_score: number | null
          created_at: string
          dismissed: boolean | null
          id: string
          manga_id: string | null
          reason: string | null
          recommendation_type: string
          user_id: string
        }
        Insert: {
          anime_id?: string | null
          confidence_score?: number | null
          created_at?: string
          dismissed?: boolean | null
          id?: string
          manga_id?: string | null
          reason?: string | null
          recommendation_type: string
          user_id: string
        }
        Update: {
          anime_id?: string | null
          confidence_score?: number | null
          created_at?: string
          dismissed?: boolean | null
          id?: string
          manga_id?: string | null
          reason?: string | null
          recommendation_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          review_id?: string
          user_id?: string
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
          created_at: string
          helpful_count: number | null
          id: string
          manga_id: string | null
          rating: number | null
          spoiler_warning: boolean | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id?: string | null
          content: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          manga_id?: string | null
          rating?: number | null
          spoiler_warning?: boolean | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: string | null
          content?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          manga_id?: string | null
          rating?: number | null
          spoiler_warning?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string
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
          content_type: string
          created_at: string
          error_message: string | null
          id: string
          items_processed: number | null
          operation_type: string
          page: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          content_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          items_processed?: number | null
          operation_type: string
          page?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          content_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          items_processed?: number | null
          operation_type?: string
          page?: number | null
          status?: string
        }
        Relationships: []
      }
      user_anime_lists: {
        Row: {
          anime_id: string
          created_at: string
          episodes_watched: number | null
          finish_date: string | null
          id: string
          notes: string | null
          score: number | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: string
          created_at?: string
          episodes_watched?: number | null
          finish_date?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: string
          created_at?: string
          episodes_watched?: number | null
          finish_date?: string | null
          id?: string
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
          age_verified: boolean
          content_rating_preference: string
          created_at: string
          id: string
          show_adult_content: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          age_verification_date?: string | null
          age_verified?: boolean
          content_rating_preference?: string
          created_at?: string
          id?: string
          show_adult_content?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          age_verification_date?: string | null
          age_verified?: boolean
          content_rating_preference?: string
          created_at?: string
          id?: string
          show_adult_content?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_manga_lists: {
        Row: {
          chapters_read: number | null
          created_at: string
          finish_date: string | null
          id: string
          manga_id: string
          notes: string | null
          score: number | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
          volumes_read: number | null
        }
        Insert: {
          chapters_read?: number | null
          created_at?: string
          finish_date?: string | null
          id?: string
          manga_id: string
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
          volumes_read?: number | null
        }
        Update: {
          chapters_read?: number | null
          created_at?: string
          finish_date?: string | null
          id?: string
          manga_id?: string
          notes?: string | null
          score?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
          created_at: string
          excluded_genres: string[] | null
          id: string
          list_visibility: string | null
          notification_settings: Json | null
          preferred_genres: string[] | null
          privacy_level: string | null
          show_adult_content: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_add_sequels?: boolean | null
          created_at?: string
          excluded_genres?: string[] | null
          id?: string
          list_visibility?: string | null
          notification_settings?: Json | null
          preferred_genres?: string[] | null
          privacy_level?: string | null
          show_adult_content?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_add_sequels?: boolean | null
          created_at?: string
          excluded_genres?: string[] | null
          id?: string
          list_visibility?: string | null
          notification_settings?: Json | null
          preferred_genres?: string[] | null
          privacy_level?: string | null
          show_adult_content?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_content: {
        Row: {
          anime_id: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          influencer_id: string
          like_count: number | null
          manga_id: string | null
          platform: string
          platform_video_id: string | null
          published_at: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          view_count: number | null
        }
        Insert: {
          anime_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          influencer_id: string
          like_count?: number | null
          manga_id?: string | null
          platform: string
          platform_video_id?: string | null
          published_at?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          view_count?: number | null
        }
        Update: {
          anime_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          influencer_id?: string
          like_count?: number | null
          manga_id?: string | null
          platform?: string
          platform_video_id?: string | null
          published_at?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_content_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_content_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_content_manga_id_fkey"
            columns: ["manga_id"]
            isOneToOne: false
            referencedRelation: "manga"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_expired_posts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
