-- COMPREHENSIVE SECURITY AND PERFORMANCE FINAL FIX
-- Address all remaining 16 security issues and 98 performance issues

-- SECURITY: Fix all remaining overly permissive policies and add missing ones
-- Drop any remaining overly broad policies
DROP POLICY IF EXISTS "Public read anime_details" ON public.anime_details;
DROP POLICY IF EXISTS "Public read manga_details" ON public.manga_details;
DROP POLICY IF EXISTS "Public read titles" ON public.titles;
DROP POLICY IF EXISTS "Public read genres" ON public.genres;
DROP POLICY IF EXISTS "Public read studios" ON public.studios;
DROP POLICY IF EXISTS "Public read authors" ON public.authors;

-- Replace with authenticated-only policies for better security
CREATE POLICY "Authenticated users read anime_details" ON public.anime_details 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users read manga_details" ON public.manga_details 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users read titles" ON public.titles 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users read genres" ON public.genres 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users read studios" ON public.studios 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users read authors" ON public.authors 
FOR SELECT TO authenticated USING (true);

-- Ensure junction tables have proper policies
CREATE POLICY "Authenticated users read title_genres" ON public.title_genres 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users read title_studios" ON public.title_studios 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users read title_authors" ON public.title_authors 
FOR SELECT TO authenticated USING (true);

-- PERFORMANCE: Add comprehensive indexes for all remaining bottlenecks

-- Critical anime/manga filtering indexes
CREATE INDEX IF NOT EXISTS idx_anime_details_status_type 
ON anime_details (status, type) WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anime_details_episodes_status 
ON anime_details (episodes, status) WHERE episodes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_manga_details_status_type 
ON manga_details (status, type) WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_manga_details_chapters_status 
ON manga_details (chapters, status) WHERE chapters IS NOT NULL;

-- Title search and filtering performance
CREATE INDEX IF NOT EXISTS idx_titles_year_score 
ON titles (year DESC, score DESC) WHERE year IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_titles_popularity_rank 
ON titles (popularity ASC, rank ASC) WHERE popularity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_titles_anilist_id_unique 
ON titles (anilist_id) WHERE anilist_id IS NOT NULL;

-- Junction table performance indexes
CREATE INDEX IF NOT EXISTS idx_title_genres_title_lookup 
ON title_genres (title_id);

CREATE INDEX IF NOT EXISTS idx_title_genres_genre_lookup 
ON title_genres (genre_id);

CREATE INDEX IF NOT EXISTS idx_title_studios_title_lookup 
ON title_studios (title_id);

CREATE INDEX IF NOT EXISTS idx_title_studios_studio_lookup 
ON title_studios (studio_id);

CREATE INDEX IF NOT EXISTS idx_title_authors_title_lookup 
ON title_authors (title_id);

CREATE INDEX IF NOT EXISTS idx_title_authors_author_lookup 
ON title_authors (author_id);

-- User activity performance indexes
CREATE INDEX IF NOT EXISTS idx_user_title_lists_status_media 
ON user_title_lists (status_id, media_type, user_id);

CREATE INDEX IF NOT EXISTS idx_user_title_lists_score_status 
ON user_title_lists (score DESC, status_id) WHERE score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_title_lists_progress 
ON user_title_lists (episodes_watched, chapters_read, user_id);

-- Review system indexes
CREATE INDEX IF NOT EXISTS idx_reviews_title_rating 
ON reviews (title_id, rating DESC) WHERE rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_user_created 
ON reviews (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_reactions_review_type 
ON review_reactions (review_id, reaction_type);

-- Activity and gamification indexes
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_type_created 
ON activity_feed (user_id, activity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_activities_user_type_created 
ON daily_activities (user_id, activity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_created 
ON user_follows (follower_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_following_created 
ON user_follows (following_id, created_at DESC);

-- Profile and preferences indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username_verification 
ON profiles (username) WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_verification_status 
ON profiles (verification_status, verification_required_until);

CREATE INDEX IF NOT EXISTS idx_claimed_usernames_user_active 
ON claimed_usernames (user_id, is_active) WHERE is_active = true;

-- Content sync and logging indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_status_created 
ON sync_logs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_sync_status_type_status 
ON content_sync_status (content_type, status);

CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_executed 
ON cron_job_logs (job_name, executed_at DESC);

-- Set ultra-aggressive autovacuum for all critical tables
ALTER TABLE titles SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_threshold = 25,
  autovacuum_analyze_threshold = 10
);

ALTER TABLE user_title_lists SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 50,
  autovacuum_analyze_threshold = 25
);

ALTER TABLE profiles SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 50
);

-- Optimize lookup tables
ALTER TABLE list_statuses SET (
  autovacuum_vacuum_scale_factor = 0.5,
  autovacuum_analyze_scale_factor = 0.25
);

-- Force immediate statistics update for query planner
ANALYZE anime_details;
ANALYZE manga_details;
ANALYZE titles;
ANALYZE user_title_lists;
ANALYZE profiles;
ANALYZE reviews;
ANALYZE title_genres;
ANALYZE title_studios;
ANALYZE title_authors;

-- Final comprehensive analyze
ANALYZE;