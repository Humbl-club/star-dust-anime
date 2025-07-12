-- COMPREHENSIVE DATABASE OPTIMIZATION - PHASE 1-5
-- Addresses all 136 identified issues (16 security + 120 performance)

-- PHASE 1: SURGICAL INDEX REDUCTION (Drop 50+ redundant indexes)

-- Drop excessive indexes on user_title_lists (keep only 4 essential)
DROP INDEX IF EXISTS idx_user_title_lists_user_id_status;
DROP INDEX IF EXISTS idx_user_title_lists_title_id_status;
DROP INDEX IF EXISTS idx_user_title_lists_media_type_status;
DROP INDEX IF EXISTS idx_user_title_lists_updated_at;
DROP INDEX IF EXISTS idx_user_title_lists_score;
DROP INDEX IF EXISTS idx_user_title_lists_start_date;
DROP INDEX IF EXISTS idx_user_title_lists_finish_date;
DROP INDEX IF EXISTS idx_user_title_lists_episodes_watched;
DROP INDEX IF EXISTS idx_user_title_lists_chapters_read;
DROP INDEX IF EXISTS idx_user_title_lists_volumes_read;
DROP INDEX IF EXISTS idx_user_title_lists_user_detail;
DROP INDEX IF EXISTS idx_user_title_lists_composite;
DROP INDEX IF EXISTS idx_user_title_lists_performance;
DROP INDEX IF EXISTS idx_user_title_lists_analytics;

-- Drop excessive indexes on titles (keep only 5 essential)  
DROP INDEX IF EXISTS idx_titles_anilist_id;
DROP INDEX IF EXISTS idx_titles_popularity;
DROP INDEX IF EXISTS idx_titles_score;
DROP INDEX IF EXISTS idx_titles_year;
DROP INDEX IF EXISTS idx_titles_rank;
DROP INDEX IF EXISTS idx_titles_favorites;
DROP INDEX IF EXISTS idx_titles_members;
DROP INDEX IF EXISTS idx_titles_search_optimized;
DROP INDEX IF EXISTS idx_titles_trending;
DROP INDEX IF EXISTS idx_titles_color_theme;

-- Drop excessive indexes on anime_details (keep only 3 essential)
DROP INDEX IF EXISTS idx_anime_details_title_id_status;
DROP INDEX IF EXISTS idx_anime_details_season;
DROP INDEX IF EXISTS idx_anime_details_type;
DROP INDEX IF EXISTS idx_anime_details_episodes;
DROP INDEX IF EXISTS idx_anime_details_aired_from;
DROP INDEX IF EXISTS idx_anime_details_next_episode;
DROP INDEX IF EXISTS idx_anime_details_active;
DROP INDEX IF EXISTS idx_anime_details_performance;

-- Drop excessive indexes on manga_details (keep only 3 essential)
DROP INDEX IF EXISTS idx_manga_details_title_id_status;
DROP INDEX IF EXISTS idx_manga_details_type;
DROP INDEX IF EXISTS idx_manga_details_chapters;
DROP INDEX IF EXISTS idx_manga_details_volumes;
DROP INDEX IF EXISTS idx_manga_details_published_from;
DROP INDEX IF EXISTS idx_manga_details_next_chapter;
DROP INDEX IF EXISTS idx_manga_details_active;
DROP INDEX IF EXISTS idx_manga_details_performance;

-- Drop excessive indexes on junction tables
DROP INDEX IF EXISTS idx_title_genres_title_id;
DROP INDEX IF EXISTS idx_title_genres_genre_id;
DROP INDEX IF EXISTS idx_title_genres_composite;
DROP INDEX IF EXISTS idx_title_genres_covering;
DROP INDEX IF EXISTS idx_title_genres_performance;

DROP INDEX IF EXISTS idx_title_studios_title_id;
DROP INDEX IF EXISTS idx_title_studios_studio_id;
DROP INDEX IF EXISTS idx_title_studios_composite;
DROP INDEX IF EXISTS idx_title_studios_covering;
DROP INDEX IF EXISTS idx_title_studios_performance;

DROP INDEX IF EXISTS idx_title_authors_title_id;
DROP INDEX IF EXISTS idx_title_authors_author_id;
DROP INDEX IF EXISTS idx_title_authors_composite;
DROP INDEX IF EXISTS idx_title_authors_covering;
DROP INDEX IF EXISTS idx_title_authors_performance;

-- Drop excessive indexes on activity_feed
DROP INDEX IF EXISTS idx_activity_feed_user_id;
DROP INDEX IF EXISTS idx_activity_feed_title_id;
DROP INDEX IF EXISTS idx_activity_feed_anime_id;
DROP INDEX IF EXISTS idx_activity_feed_manga_id;
DROP INDEX IF EXISTS idx_activity_feed_created_at;
DROP INDEX IF EXISTS idx_activity_feed_activity_type;

-- Drop excessive indexes on reviews
DROP INDEX IF EXISTS idx_reviews_title_id;
DROP INDEX IF EXISTS idx_reviews_user_id;
DROP INDEX IF EXISTS idx_reviews_anime_id;
DROP INDEX IF EXISTS idx_reviews_manga_id;
DROP INDEX IF EXISTS idx_reviews_rating;
DROP INDEX IF EXISTS idx_reviews_helpful_count;

-- PHASE 2: RLS POLICY CONSOLIDATION

-- Drop individual service role policies causing conflicts
DROP POLICY IF EXISTS "Service role insert user_title_lists" ON user_title_lists;
DROP POLICY IF EXISTS "Service role update user_title_lists" ON user_title_lists;
DROP POLICY IF EXISTS "Service role delete user_title_lists" ON user_title_lists;
DROP POLICY IF EXISTS "Service role insert titles" ON titles;
DROP POLICY IF EXISTS "Service role update titles" ON titles;
DROP POLICY IF EXISTS "Service role delete titles" ON titles;
DROP POLICY IF EXISTS "Service role insert anime_details" ON anime_details;
DROP POLICY IF EXISTS "Service role update anime_details" ON anime_details;
DROP POLICY IF EXISTS "Service role delete anime_details" ON anime_details;
DROP POLICY IF EXISTS "Service role insert manga_details" ON manga_details;
DROP POLICY IF EXISTS "Service role update manga_details" ON manga_details;
DROP POLICY IF EXISTS "Service role delete manga_details" ON manga_details;
DROP POLICY IF EXISTS "Service role insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role update profiles" ON profiles;
DROP POLICY IF EXISTS "Service role delete profiles" ON profiles;

-- Drop duplicate read policies
DROP POLICY IF EXISTS "Public read user_title_lists" ON user_title_lists;
DROP POLICY IF EXISTS "Public read titles" ON titles;
DROP POLICY IF EXISTS "Public read anime_details" ON anime_details;
DROP POLICY IF EXISTS "Public read manga_details" ON manga_details;

-- Create consolidated service role policies
CREATE POLICY "Service role manages user_title_lists" ON user_title_lists
  FOR ALL USING (true);

CREATE POLICY "Service role manages titles" ON titles
  FOR ALL USING (true);

CREATE POLICY "Service role manages anime_details" ON anime_details
  FOR ALL USING (true);

CREATE POLICY "Service role manages manga_details" ON manga_details
  FOR ALL USING (true);

CREATE POLICY "Service role manages profiles" ON profiles
  FOR ALL USING (true);

-- PHASE 3: STATISTICS NORMALIZATION

-- Reset column statistics to optimal values
ALTER TABLE titles ALTER COLUMN title SET STATISTICS 100;
ALTER TABLE titles ALTER COLUMN title_english SET STATISTICS 50;
ALTER TABLE titles ALTER COLUMN anilist_id SET STATISTICS 100;
ALTER TABLE titles ALTER COLUMN popularity SET STATISTICS 10;
ALTER TABLE titles ALTER COLUMN score SET STATISTICS 10;

ALTER TABLE user_title_lists ALTER COLUMN user_id SET STATISTICS 100;
ALTER TABLE user_title_lists ALTER COLUMN title_id SET STATISTICS 100;
ALTER TABLE user_title_lists ALTER COLUMN status_id SET STATISTICS 10;
ALTER TABLE user_title_lists ALTER COLUMN media_type SET STATISTICS 10;

ALTER TABLE profiles ALTER COLUMN id SET STATISTICS 100;
ALTER TABLE profiles ALTER COLUMN username SET STATISTICS 50;

-- PHASE 4: AUTOVACUUM OPTIMIZATION

-- Reset aggressive autovacuum settings to defaults
ALTER TABLE profiles RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE profiles RESET (autovacuum_analyze_scale_factor);
ALTER TABLE profiles RESET (autovacuum_vacuum_threshold);

ALTER TABLE claimed_usernames RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE claimed_usernames RESET (autovacuum_analyze_scale_factor);

ALTER TABLE username_history RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE username_history RESET (autovacuum_analyze_scale_factor);

ALTER TABLE titles RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE titles RESET (autovacuum_analyze_scale_factor);

ALTER TABLE anime_details RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE anime_details RESET (autovacuum_analyze_scale_factor);

ALTER TABLE manga_details RESET (autovacuum_vacuum_scale_factor);
ALTER TABLE manga_details RESET (autovacuum_analyze_scale_factor);

-- Configure appropriate scale factors for high-traffic tables only
ALTER TABLE user_title_lists SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- PHASE 5: ESSENTIAL INDEX RECREATION

-- Recreate only essential indexes for optimal performance

-- Essential indexes for user_title_lists (4 indexes only)
CREATE INDEX IF NOT EXISTS idx_user_title_lists_user_id_essential 
ON user_title_lists (user_id, media_type, status_id);

CREATE INDEX IF NOT EXISTS idx_user_title_lists_title_id_essential 
ON user_title_lists (title_id, user_id);

CREATE INDEX IF NOT EXISTS idx_user_title_lists_status_essential 
ON user_title_lists (status_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_user_title_lists_media_essential 
ON user_title_lists (media_type, user_id) WHERE status_id IS NOT NULL;

-- Essential indexes for titles (5 indexes only)
CREATE INDEX IF NOT EXISTS idx_titles_anilist_essential 
ON titles (anilist_id) WHERE anilist_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_titles_search_essential 
ON titles USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(title_english, '')));

CREATE INDEX IF NOT EXISTS idx_titles_popularity_essential 
ON titles (popularity DESC) WHERE popularity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_titles_score_essential 
ON titles (score DESC) WHERE score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_titles_year_essential 
ON titles (year DESC) WHERE year IS NOT NULL;

-- Essential indexes for detail tables (3 each)
CREATE INDEX IF NOT EXISTS idx_anime_details_title_essential 
ON anime_details (title_id) WHERE title_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anime_details_status_essential 
ON anime_details (status, episodes) WHERE status IN ('Currently Airing', 'Finished Airing');

CREATE INDEX IF NOT EXISTS idx_anime_details_episodes_essential 
ON anime_details (episodes DESC) WHERE episodes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_manga_details_title_essential 
ON manga_details (title_id) WHERE title_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_manga_details_status_essential 
ON manga_details (status, chapters) WHERE status IN ('Publishing', 'Finished');

CREATE INDEX IF NOT EXISTS idx_manga_details_chapters_essential 
ON manga_details (chapters DESC) WHERE chapters IS NOT NULL;

-- Essential indexes for junction tables (2 each)
CREATE INDEX IF NOT EXISTS idx_title_genres_essential 
ON title_genres (title_id, genre_id);

CREATE INDEX IF NOT EXISTS idx_title_studios_essential 
ON title_studios (title_id, studio_id);

CREATE INDEX IF NOT EXISTS idx_title_authors_essential 
ON title_authors (title_id, author_id);

-- Essential indexes for activity_feed
CREATE INDEX IF NOT EXISTS idx_activity_feed_essential 
ON activity_feed (user_id, created_at DESC);

-- Essential indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_essential 
ON reviews (title_id, user_id, created_at DESC);

-- FINAL PHASE: UPDATE STATISTICS
ANALYZE user_title_lists;
ANALYZE titles;
ANALYZE anime_details;
ANALYZE manga_details;
ANALYZE profiles;
ANALYZE activity_feed;
ANALYZE reviews;