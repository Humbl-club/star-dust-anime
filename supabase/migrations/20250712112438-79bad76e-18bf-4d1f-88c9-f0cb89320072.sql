-- Phase 3: Performance Optimization - Optimize High-Frequency Tables
-- Set optimized autovacuum settings for remaining high-churn tables
ALTER TABLE username_history SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE daily_activities SET (
  autovacuum_vacuum_scale_factor = 0.15,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE sync_logs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 50
);

-- Add performance indexes for frequently queried tables
CREATE INDEX IF NOT EXISTS idx_sync_logs_status_created 
ON sync_logs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_sync_status_type_status 
ON content_sync_status (content_type, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date 
ON daily_activities (user_id, created_at DESC);

-- Optimize title relationships for faster JOINs
CREATE INDEX IF NOT EXISTS idx_titles_year_score_active 
ON titles (year DESC, score DESC) 
WHERE image_url IS NOT NULL AND synopsis IS NOT NULL;

-- Add composite index for user lists performance
CREATE INDEX IF NOT EXISTS idx_user_title_lists_composite 
ON user_title_lists (user_id, media_type, status_id, updated_at DESC);

-- Final statistics update
ANALYZE titles, user_title_lists, profiles, anime_details, manga_details;