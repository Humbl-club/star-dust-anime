
-- Drop remaining unused indexes that were missed in the previous migration

-- Drop unused indexes from manga_details table
DROP INDEX IF EXISTS idx_manga_details_last_sync;
DROP INDEX IF EXISTS idx_manga_details_status;

-- Drop unused indexes from anime_details table  
DROP INDEX IF EXISTS idx_anime_details_last_sync;
