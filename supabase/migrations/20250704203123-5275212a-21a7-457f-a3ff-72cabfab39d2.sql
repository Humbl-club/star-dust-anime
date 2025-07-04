-- Fix anime status constraint to accept all valid AniList/MAL status values
ALTER TABLE anime DROP CONSTRAINT IF EXISTS anime_status_check;
ALTER TABLE anime ADD CONSTRAINT anime_status_check 
CHECK (status IN (
  'Finished Airing', 'Currently Airing', 'Not yet aired', 'Cancelled', 'Hiatus',
  'Finished', 'Releasing', 'Not Yet Released', 'Cancelled', 'On Hiatus',
  'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'
));

-- Fix manga status constraint to accept all valid AniList/MAL status values  
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_status_check;
ALTER TABLE manga ADD CONSTRAINT manga_status_check
CHECK (status IN (
  'Finished', 'Publishing', 'On Hiatus', 'Discontinued', 'Not yet published',
  'Completed', 'Ongoing', 'Hiatus', 'Cancelled', 'Not Yet Published',
  'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'
));

-- Create function to handle invalid dates
CREATE OR REPLACE FUNCTION safe_date_cast(date_string text)
RETURNS date AS $$
BEGIN
  -- Handle null or empty strings
  IF date_string IS NULL OR date_string = '' OR date_string = 'null' THEN
    RETURN NULL;
  END IF;
  
  -- Try to cast the date, return NULL if invalid
  RETURN date_string::date;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better sync performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_anime_mal_id ON anime(mal_id) WHERE mal_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_anime_anilist_id ON anime(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_mal_id ON manga(mal_id) WHERE mal_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_anilist_id ON manga(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_anime_last_sync ON anime(last_sync_check);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_last_sync ON manga(last_sync_check);