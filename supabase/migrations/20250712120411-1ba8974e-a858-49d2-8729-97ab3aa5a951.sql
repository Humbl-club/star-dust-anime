-- COMPREHENSIVE DATABASE OPTIMIZATION: Fix 136 Issues (16 Security + 120 Performance)
-- Phase 1: Index Cleanup - Remove duplicates and overlapping indexes

-- Drop duplicate indexes on user_title_lists (keep only essential ones)
DROP INDEX IF EXISTS idx_user_title_lists_user_status;
DROP INDEX IF EXISTS idx_user_title_lists_title_score;
DROP INDEX IF EXISTS idx_user_title_lists_media_status;
DROP INDEX IF EXISTS idx_user_title_lists_user_media;
DROP INDEX IF EXISTS idx_user_title_lists_status_score;
DROP INDEX IF EXISTS idx_user_title_lists_title_updated;
DROP INDEX IF EXISTS idx_user_title_lists_user_updated;
DROP INDEX IF EXISTS idx_user_title_lists_score_updated;
DROP INDEX IF EXISTS idx_user_title_lists_comprehensive;
DROP INDEX IF EXISTS idx_user_title_lists_activity;
DROP INDEX IF EXISTS idx_user_title_lists_recent_activity;

-- Drop duplicate indexes on titles (keep only essential ones)
DROP INDEX IF EXISTS idx_titles_score_popularity;
DROP INDEX IF EXISTS idx_titles_year_score;
DROP INDEX IF EXISTS idx_titles_popularity_rank;
DROP INDEX IF EXISTS idx_titles_anilist_score;
DROP INDEX IF EXISTS idx_titles_comprehensive_search;
DROP INDEX IF EXISTS idx_titles_full_search;
DROP INDEX IF EXISTS idx_titles_advanced_search;
DROP INDEX IF EXISTS idx_titles_popularity_score;

-- Drop overlapping indexes on junction tables
DROP INDEX IF EXISTS idx_title_genres_comprehensive;
DROP INDEX IF EXISTS idx_title_studios_comprehensive;
DROP INDEX IF EXISTS idx_title_authors_comprehensive;
DROP INDEX IF EXISTS idx_title_genres_genre_lookup;
DROP INDEX IF EXISTS idx_title_studios_studio_lookup;
DROP INDEX IF EXISTS idx_title_authors_author_lookup;

-- Drop duplicate anime/manga detail indexes
DROP INDEX IF EXISTS idx_anime_details_comprehensive;
DROP INDEX IF EXISTS idx_manga_details_comprehensive;
DROP INDEX IF EXISTS idx_anime_details_status_episodes;
DROP INDEX IF EXISTS idx_manga_details_status_chapters;
DROP INDEX IF EXISTS idx_anime_details_next_episode;
DROP INDEX IF EXISTS idx_manga_details_next_chapter;

-- Drop overlapping profile and activity indexes
DROP INDEX IF EXISTS idx_profiles_comprehensive;
DROP INDEX IF EXISTS idx_profiles_verification_lookup;
DROP INDEX IF EXISTS idx_activity_feed_comprehensive;
DROP INDEX IF EXISTS idx_activity_feed_user_type;
DROP INDEX IF EXISTS idx_reviews_comprehensive;
DROP INDEX IF EXISTS idx_reviews_user_content;

-- Phase 2: RLS Policy Consolidation - Remove duplicates and conflicts

-- Drop duplicate auth policies
DROP POLICY IF EXISTS "Auth read anime_details" ON anime_details;
DROP POLICY IF EXISTS "Auth read manga_details" ON manga_details;
DROP POLICY IF EXISTS "Auth read titles" ON titles;
DROP POLICY IF EXISTS "Auth read genres" ON genres;
DROP POLICY IF EXISTS "Auth read studios" ON studios;
DROP POLICY IF EXISTS "Auth read authors" ON authors;
DROP POLICY IF EXISTS "Auth read title_genres" ON title_genres;
DROP POLICY IF EXISTS "Auth read title_studios" ON title_studios;
DROP POLICY IF EXISTS "Auth read title_authors" ON title_authors;

-- Consolidate service role policies
DROP POLICY IF EXISTS "Service insert anime_details" ON anime_details;
DROP POLICY IF EXISTS "Service update anime_details" ON anime_details;
DROP POLICY IF EXISTS "Service delete anime_details" ON anime_details;
DROP POLICY IF EXISTS "Service insert manga_details" ON manga_details;
DROP POLICY IF EXISTS "Service update manga_details" ON manga_details;
DROP POLICY IF EXISTS "Service delete manga_details" ON manga_details;
DROP POLICY IF EXISTS "Service insert titles" ON titles;
DROP POLICY IF EXISTS "Service update titles" ON titles;
DROP POLICY IF EXISTS "Service delete titles" ON titles;
DROP POLICY IF EXISTS "Service insert genres" ON genres;
DROP POLICY IF EXISTS "Service update genres" ON genres;
DROP POLICY IF EXISTS "Service delete genres" ON genres;
DROP POLICY IF EXISTS "Service insert studios" ON studios;
DROP POLICY IF EXISTS "Service update studios" ON studios;
DROP POLICY IF EXISTS "Service delete studios" ON studios;
DROP POLICY IF EXISTS "Service insert authors" ON authors;
DROP POLICY IF EXISTS "Service update authors" ON authors;
DROP POLICY IF EXISTS "Service delete authors" ON authors;
DROP POLICY IF EXISTS "Service insert title_genres" ON title_genres;
DROP POLICY IF EXISTS "Service update title_genres" ON title_genres;
DROP POLICY IF EXISTS "Service delete title_genres" ON title_genres;
DROP POLICY IF EXISTS "Service insert title_studios" ON title_studios;
DROP POLICY IF EXISTS "Service update title_studios" ON title_studios;
DROP POLICY IF EXISTS "Service delete title_studios" ON title_studios;
DROP POLICY IF EXISTS "Service insert title_authors" ON title_authors;
DROP POLICY IF EXISTS "Service update title_authors" ON title_authors;
DROP POLICY IF EXISTS "Service delete title_authors" ON title_authors;

-- Create consolidated service role policies
CREATE POLICY "Service role manages anime_details" ON anime_details FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages manga_details" ON manga_details FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages titles" ON titles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages genres" ON genres FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages studios" ON studios FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages authors" ON authors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages title_genres" ON title_genres FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages title_studios" ON title_studios FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages title_authors" ON title_authors FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Phase 3: Statistics Normalization - Reset to optimal defaults
ALTER TABLE titles ALTER COLUMN title SET STATISTICS 100;
ALTER TABLE titles ALTER COLUMN title_english SET STATISTICS 100;
ALTER TABLE titles ALTER COLUMN synopsis SET STATISTICS 200;
ALTER TABLE titles ALTER COLUMN score SET STATISTICS 100;
ALTER TABLE titles ALTER COLUMN popularity SET STATISTICS 100;

ALTER TABLE user_title_lists ALTER COLUMN user_id SET STATISTICS 200;
ALTER TABLE user_title_lists ALTER COLUMN title_id SET STATISTICS 200;
ALTER TABLE user_title_lists ALTER COLUMN status_id SET STATISTICS 100;
ALTER TABLE user_title_lists ALTER COLUMN score SET STATISTICS 100;

ALTER TABLE profiles ALTER COLUMN username SET STATISTICS 100;
ALTER TABLE profiles ALTER COLUMN verification_status SET STATISTICS 50;

-- Phase 4: Autovacuum Optimization - Reset to balanced settings
ALTER TABLE titles RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE titles RESET (autovacuum_analyze_scale_factor);
ALTER TABLE titles RESET (autovacuum_vacuum_threshold);
ALTER TABLE titles RESET (autovacuum_analyze_threshold);

ALTER TABLE user_title_lists RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE user_title_lists RESET (autovacuum_analyze_scale_factor);
ALTER TABLE user_title_lists RESET (autovacuum_vacuum_threshold);
ALTER TABLE user_title_lists RESET (autovacuum_analyze_threshold);

ALTER TABLE profiles RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE profiles RESET (autovacuum_analyze_scale_factor);
ALTER TABLE profiles RESET (autovacuum_vacuum_threshold);
ALTER TABLE profiles RESET (autovacuum_analyze_threshold);

ALTER TABLE list_statuses RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE list_statuses RESET (autovacuum_analyze_scale_factor);
ALTER TABLE list_statuses RESET (autovacuum_vacuum_threshold);
ALTER TABLE list_statuses RESET (autovacuum_analyze_threshold);

-- Keep selective optimization only for highest-write tables
ALTER TABLE user_title_lists SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE user_title_lists SET (autovacuum_analyze_scale_factor = 0.05);

-- Phase 5: Essential Index Recreation - Keep only the most efficient ones

-- User title lists - Essential indexes only
CREATE INDEX IF NOT EXISTS idx_user_title_lists_user_status ON user_title_lists (user_id, status_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_title_lists_title_lookup ON user_title_lists (title_id, media_type);

-- Titles - Essential indexes only  
CREATE INDEX IF NOT EXISTS idx_titles_search_optimized ON titles USING GIN (to_tsvector('english', title || ' ' || COALESCE(title_english, '') || ' ' || COALESCE(synopsis, '')));
CREATE INDEX IF NOT EXISTS idx_titles_popularity_score ON titles (popularity DESC, score DESC) WHERE popularity IS NOT NULL AND score IS NOT NULL;

-- Junction tables - Essential indexes only
CREATE INDEX IF NOT EXISTS idx_title_genres_lookup ON title_genres (title_id, genre_id);
CREATE INDEX IF NOT EXISTS idx_title_studios_lookup ON title_studios (title_id, studio_id);
CREATE INDEX IF NOT EXISTS idx_title_authors_lookup ON title_authors (title_id, author_id);

-- Detail tables - Essential indexes only
CREATE INDEX IF NOT EXISTS idx_anime_details_title_lookup ON anime_details (title_id, status, episodes);
CREATE INDEX IF NOT EXISTS idx_manga_details_title_lookup ON manga_details (title_id, status, chapters);

-- Activity and reviews - Essential indexes only
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_recent ON activity_feed (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_content_lookup ON reviews (title_id, user_id, created_at DESC);

-- Final statistics update for optimal query planning
ANALYZE titles;
ANALYZE user_title_lists;
ANALYZE anime_details;
ANALYZE manga_details;
ANALYZE profiles;
ANALYZE list_statuses;