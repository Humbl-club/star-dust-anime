-- Database Performance Optimization - Final Phase
-- Adding all missing foreign key indexes and removing unused indexes

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

-- Phase 2: Remove unused indexes to reduce maintenance overhead
DROP INDEX IF EXISTS idx_activity_feed_user_id;
DROP INDEX IF EXISTS idx_user_title_lists_status_id;
DROP INDEX IF EXISTS idx_user_title_lists_title_id;