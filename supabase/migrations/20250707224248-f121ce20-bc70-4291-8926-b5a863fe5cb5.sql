-- Fix the content_sync_status check constraint to allow current operation types
ALTER TABLE content_sync_status 
DROP CONSTRAINT IF EXISTS content_sync_status_operation_type_check;

-- Add the correct check constraint
ALTER TABLE content_sync_status 
ADD CONSTRAINT content_sync_status_operation_type_check 
CHECK (operation_type IN ('comprehensive-sync', 'incremental-sync', 'full-sync', 'ultra-fast-sync', 'comprehensive-normalized-sync'));

-- Clean up any duplicate relationship entries that cause the "row a second time" error
WITH duplicates AS (
  SELECT title_id, genre_id, ROW_NUMBER() OVER (PARTITION BY title_id, genre_id ORDER BY title_id) as rn
  FROM title_genres
)
DELETE FROM title_genres 
WHERE (title_id, genre_id) IN (
  SELECT title_id, genre_id FROM duplicates WHERE rn > 1
);

WITH duplicates AS (
  SELECT title_id, studio_id, ROW_NUMBER() OVER (PARTITION BY title_id, studio_id ORDER BY title_id) as rn
  FROM title_studios
)
DELETE FROM title_studios 
WHERE (title_id, studio_id) IN (
  SELECT title_id, studio_id FROM duplicates WHERE rn > 1
);

WITH duplicates AS (
  SELECT title_id, author_id, ROW_NUMBER() OVER (PARTITION BY title_id, author_id ORDER BY title_id) as rn
  FROM title_authors
)
DELETE FROM title_authors 
WHERE (title_id, author_id) IN (
  SELECT title_id, author_id FROM duplicates WHERE rn > 1
);