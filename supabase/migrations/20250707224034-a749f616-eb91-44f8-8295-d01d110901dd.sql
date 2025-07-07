-- Fix the content_sync_status check constraint to allow current operation types
DROP CONSTRAINT IF EXISTS content_sync_status_operation_type_check ON content_sync_status;

-- Add the correct check constraint
ALTER TABLE content_sync_status 
ADD CONSTRAINT content_sync_status_operation_type_check 
CHECK (operation_type IN ('comprehensive-sync', 'incremental-sync', 'full-sync', 'ultra-fast-sync', 'comprehensive-normalized-sync'));

-- Ensure we have the unique constraints for upsert operations
ALTER TABLE titles DROP CONSTRAINT IF EXISTS titles_anilist_id_unique;
ALTER TABLE titles ADD CONSTRAINT titles_anilist_id_unique UNIQUE (anilist_id);

-- Fix any potential duplicate issues in relationship tables
DELETE FROM title_genres 
WHERE (title_id, genre_id) IN (
  SELECT title_id, genre_id 
  FROM title_genres 
  GROUP BY title_id, genre_id 
  HAVING COUNT(*) > 1
);

DELETE FROM title_studios 
WHERE (title_id, studio_id) IN (
  SELECT title_id, studio_id 
  FROM title_studios 
  GROUP BY title_id, studio_id 
  HAVING COUNT(*) > 1
);

DELETE FROM title_authors 
WHERE (title_id, author_id) IN (
  SELECT title_id, author_id 
  FROM title_authors 
  GROUP BY title_id, author_id 
  HAVING COUNT(*) > 1
);