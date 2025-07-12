-- Database Performance Optimization - Critical Foreign Key Indexes
-- Adding essential foreign key indexes and removing unused indexes

-- Phase 1: Add critical foreign key indexes for JOIN performance
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id 
ON activity_feed (user_id);

CREATE INDEX IF NOT EXISTS idx_user_title_lists_status_id 
ON user_title_lists (status_id);

CREATE INDEX IF NOT EXISTS idx_user_title_lists_title_id 
ON user_title_lists (title_id);

-- Phase 2: Remove unused indexes to reduce storage and maintenance overhead
DROP INDEX IF EXISTS idx_claimed_usernames_user_id;
DROP INDEX IF EXISTS idx_content_reports_reporter_user_id;
DROP INDEX IF EXISTS idx_review_reactions_user_id;
DROP INDEX IF EXISTS idx_title_authors_author_id;
DROP INDEX IF EXISTS idx_title_genres_genre_id;
DROP INDEX IF EXISTS idx_title_studios_studio_id;
DROP INDEX IF EXISTS idx_user_filter_presets_user_id;
DROP INDEX IF EXISTS idx_user_follows_following_id;