
-- Drop unused indexes from activity_feed table
DROP INDEX IF EXISTS idx_activity_feed_user_id;

-- Drop unused indexes from anime_details table
DROP INDEX IF EXISTS idx_anime_details_title_essential;

-- Drop unique constraint from anime_details table (not just index)
ALTER TABLE anime_details DROP CONSTRAINT IF EXISTS anime_details_title_id_unique;

-- Drop unique constraint from manga_details table (not just index) 
ALTER TABLE manga_details DROP CONSTRAINT IF EXISTS manga_details_title_id_unique;

-- Drop unused indexes from user_title_lists table
DROP INDEX IF EXISTS idx_user_title_lists_status_id;
DROP INDEX IF EXISTS idx_user_title_lists_title_id;

-- Drop unused indexes from username_history table
DROP INDEX IF EXISTS idx_username_history_user;

-- Drop unused indexes from content_sync_status table
DROP INDEX IF EXISTS idx_content_sync_status_type_status;
