-- Database Performance Optimization Migration
-- Adding missing foreign key indexes and removing unused indexes

-- Phase 1: Add missing foreign key indexes for better JOIN performance
CREATE INDEX IF NOT EXISTS idx_claimed_usernames_user_id 
ON claimed_usernames (user_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_user_id 
ON content_reports (reporter_user_id);

CREATE INDEX IF NOT EXISTS idx_review_reactions_user_id 
ON review_reactions (user_id);

CREATE INDEX IF NOT EXISTS idx_title_authors_author_id 
ON title_authors (author_id);

CREATE INDEX IF NOT EXISTS idx_title_genres_genre_id 
ON title_genres (genre_id);

CREATE INDEX IF NOT EXISTS idx_title_studios_studio_id 
ON title_studios (studio_id);

CREATE INDEX IF NOT EXISTS idx_user_filter_presets_user_id 
ON user_filter_presets (user_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_following_id 
ON user_follows (following_id);

-- Phase 2: Remove unused indexes to reduce storage overhead and maintenance cost
DROP INDEX IF EXISTS idx_cron_job_logs_job_executed;
DROP INDEX IF EXISTS idx_user_title_lists_user_id_essential;
DROP INDEX IF EXISTS idx_user_title_lists_title_id_essential;
DROP INDEX IF EXISTS idx_user_title_lists_status_essential;
DROP INDEX IF EXISTS idx_user_title_lists_media_essential;
DROP INDEX IF EXISTS idx_titles_anilist_essential;
DROP INDEX IF EXISTS idx_titles_search_essential;
DROP INDEX IF EXISTS idx_titles_popularity_essential;
DROP INDEX IF EXISTS idx_titles_score_essential;
DROP INDEX IF EXISTS idx_titles_year_essential;
DROP INDEX IF EXISTS idx_anime_details_status_essential;
DROP INDEX IF EXISTS idx_anime_details_episodes_essential;
DROP INDEX IF EXISTS idx_manga_details_title_essential;
DROP INDEX IF EXISTS idx_manga_details_status_essential;
DROP INDEX IF EXISTS idx_manga_details_chapters_essential;
DROP INDEX IF EXISTS idx_title_authors_essential;
DROP INDEX IF EXISTS idx_activity_feed_essential;
DROP INDEX IF EXISTS idx_generated_characters_username;