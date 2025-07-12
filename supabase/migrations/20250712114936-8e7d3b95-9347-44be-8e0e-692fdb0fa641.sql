-- CRITICAL SECURITY AND PERFORMANCE RESOLUTION
-- Target all 16 security issues and 113 performance issues systematically

-- SECURITY PHASE 1: Remove ALL existing problematic policies and start fresh
DROP POLICY IF EXISTS "Authenticated read anime_details" ON public.anime_details;
DROP POLICY IF EXISTS "Authenticated read manga_details" ON public.manga_details;
DROP POLICY IF EXISTS "Authenticated read titles" ON public.titles;
DROP POLICY IF EXISTS "Authenticated read genres" ON public.genres;
DROP POLICY IF EXISTS "Authenticated read studios" ON public.studios;
DROP POLICY IF EXISTS "Authenticated read authors" ON public.authors;
DROP POLICY IF EXISTS "Authenticated read title_genres" ON public.title_genres;
DROP POLICY IF EXISTS "Authenticated read title_studios" ON public.title_studios;
DROP POLICY IF EXISTS "Authenticated read title_authors" ON public.title_authors;
DROP POLICY IF EXISTS "Service role manages anime_details" ON public.anime_details;
DROP POLICY IF EXISTS "Service role manages manga_details" ON public.manga_details;
DROP POLICY IF EXISTS "Service role manages titles" ON public.titles;
DROP POLICY IF EXISTS "Service role manages genres" ON public.genres;
DROP POLICY IF EXISTS "Service role manages studios" ON public.studios;
DROP POLICY IF EXISTS "Service role manages authors" ON public.authors;
DROP POLICY IF EXISTS "Service role manages title_genres" ON public.title_genres;
DROP POLICY IF EXISTS "Service role manages title_studios" ON public.title_studios;
DROP POLICY IF EXISTS "Service role manages title_authors" ON public.title_authors;
DROP POLICY IF EXISTS "Authenticated users read anime_details" ON public.anime_details;
DROP POLICY IF EXISTS "Authenticated users read manga_details" ON public.manga_details;
DROP POLICY IF EXISTS "Authenticated users read titles" ON public.titles;
DROP POLICY IF EXISTS "Authenticated users read genres" ON public.genres;
DROP POLICY IF EXISTS "Authenticated users read studios" ON public.studios;
DROP POLICY IF EXISTS "Authenticated users read authors" ON public.authors;
DROP POLICY IF EXISTS "Authenticated users read title_genres" ON public.title_genres;
DROP POLICY IF EXISTS "Authenticated users read title_studios" ON public.title_studios;
DROP POLICY IF EXISTS "Authenticated users read title_authors" ON public.title_authors;

-- SECURITY PHASE 2: Create secure, specific policies
-- Core content tables - READ ONLY for all authenticated users
CREATE POLICY "Read anime_details" ON public.anime_details 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Read manga_details" ON public.manga_details 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Read titles" ON public.titles 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Read genres" ON public.genres 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Read studios" ON public.studios 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Read authors" ON public.authors 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Read title_genres" ON public.title_genres 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Read title_studios" ON public.title_studios 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Read title_authors" ON public.title_authors 
FOR SELECT TO authenticated USING (true);

-- Service role policies for data management
CREATE POLICY "Service write anime_details" ON public.anime_details 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update anime_details" ON public.anime_details 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service write manga_details" ON public.manga_details 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update manga_details" ON public.manga_details 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service write titles" ON public.titles 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update titles" ON public.titles 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service write genres" ON public.genres 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update genres" ON public.genres 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service write studios" ON public.studios 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update studios" ON public.studios 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service write authors" ON public.authors 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update authors" ON public.authors 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service write title_genres" ON public.title_genres 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update title_genres" ON public.title_genres 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service write title_studios" ON public.title_studios 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update title_studios" ON public.title_studios 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service write title_authors" ON public.title_authors 
FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update title_authors" ON public.title_authors 
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- PERFORMANCE PHASE 1: Drop potentially conflicting indexes
DROP INDEX IF EXISTS idx_anime_details_status_type;
DROP INDEX IF EXISTS idx_anime_details_episodes_status;
DROP INDEX IF EXISTS idx_manga_details_status_type;
DROP INDEX IF EXISTS idx_manga_details_chapters_status;
DROP INDEX IF EXISTS idx_titles_year_score;
DROP INDEX IF EXISTS idx_titles_popularity_rank;
DROP INDEX IF EXISTS idx_titles_anilist_id_unique;

-- PERFORMANCE PHASE 2: Create optimized covering indexes
-- Anime details performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_anime_details_multi_lookup 
ON anime_details (title_id, status, type, episodes) 
WHERE status IS NOT NULL AND episodes IS NOT NULL;

-- Manga details performance  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_details_multi_lookup 
ON manga_details (title_id, status, type, chapters) 
WHERE status IS NOT NULL AND chapters IS NOT NULL;

-- Titles core performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_titles_core_search 
ON titles (popularity DESC, score DESC, year DESC, rank ASC) 
WHERE popularity IS NOT NULL AND score IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_titles_anilist_lookup 
ON titles (anilist_id) 
WHERE anilist_id IS NOT NULL;

-- Junction tables optimized
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_title_genres_complete 
ON title_genres (title_id, genre_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_title_studios_complete 
ON title_studios (title_id, studio_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_title_authors_complete 
ON title_authors (title_id, author_id);

-- User lists ultra performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_lists_complete 
ON user_title_lists (user_id, media_type, status_id, score DESC, updated_at DESC) 
INCLUDE (title_id, episodes_watched, chapters_read, notes);

-- Reviews performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_complete 
ON reviews (title_id, user_id, rating DESC, created_at DESC) 
WHERE rating IS NOT NULL;

-- Activity performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_complete 
ON activity_feed (user_id, activity_type, created_at DESC) 
INCLUDE (title_id, metadata);

-- Profile performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_complete 
ON profiles (id, username, verification_status) 
WHERE username IS NOT NULL;

-- PERFORMANCE PHASE 3: Table-level optimizations
-- Set fill factor for better update performance
ALTER TABLE titles SET (fillfactor = 90);
ALTER TABLE user_title_lists SET (fillfactor = 85);
ALTER TABLE reviews SET (fillfactor = 90);
ALTER TABLE profiles SET (fillfactor = 90);

-- Ultra-aggressive autovacuum for hot tables
ALTER TABLE titles SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_threshold = 10,
  autovacuum_analyze_threshold = 5,
  autovacuum_vacuum_cost_delay = 10
);

ALTER TABLE user_title_lists SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_threshold = 25,
  autovacuum_analyze_threshold = 10,
  autovacuum_vacuum_cost_delay = 5
);

-- Enable parallel queries for large tables
ALTER TABLE titles SET (parallel_workers = 4);
ALTER TABLE user_title_lists SET (parallel_workers = 2);

-- PERFORMANCE PHASE 4: Statistics optimization
-- Update statistics targets for better query planning
ALTER TABLE titles ALTER COLUMN popularity SET STATISTICS 1000;
ALTER TABLE titles ALTER COLUMN score SET STATISTICS 1000;
ALTER TABLE titles ALTER COLUMN year SET STATISTICS 500;
ALTER TABLE user_title_lists ALTER COLUMN status_id SET STATISTICS 500;
ALTER TABLE user_title_lists ALTER COLUMN media_type SET STATISTICS 200;

-- Force immediate statistics collection
ANALYZE titles;
ANALYZE anime_details;
ANALYZE manga_details;
ANALYZE user_title_lists;
ANALYZE profiles;
ANALYZE reviews;
ANALYZE title_genres;
ANALYZE title_studios;
ANALYZE title_authors;