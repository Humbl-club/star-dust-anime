
-- Phase 1: Pre-migration validation and setup
-- Check data integrity (these should return 0 if data is clean)
DO $$
BEGIN
  -- Verify no duplicate title_id values in anime_details
  IF EXISTS (
    SELECT title_id 
    FROM anime_details 
    WHERE title_id IS NOT NULL 
    GROUP BY title_id 
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate title_id values found in anime_details';
  END IF;
  
  -- Verify no duplicate title_id values in manga_details
  IF EXISTS (
    SELECT title_id 
    FROM manga_details 
    WHERE title_id IS NOT NULL 
    GROUP BY title_id 
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate title_id values found in manga_details';
  END IF;
  
  RAISE NOTICE 'Data integrity validation passed';
END $$;

-- Phase 2: Add proper foreign key constraints first
ALTER TABLE anime_details 
ADD CONSTRAINT anime_details_title_id_fkey 
FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE;

ALTER TABLE manga_details 
ADD CONSTRAINT manga_details_title_id_fkey 
FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE;

-- Phase 3: Schema restructuring for anime_details
-- Step 1: Make title_id NOT NULL (it should already be based on our data)
ALTER TABLE anime_details ALTER COLUMN title_id SET NOT NULL;

-- Step 2: Drop the current primary key constraint
ALTER TABLE anime_details DROP CONSTRAINT anime_details_pkey;

-- Step 3: Add title_id as new primary key
ALTER TABLE anime_details ADD CONSTRAINT anime_details_pkey PRIMARY KEY (title_id);

-- Step 4: Drop the old id column and its index
DROP INDEX IF EXISTS idx_anime_details_id;
ALTER TABLE anime_details DROP COLUMN id;

-- Phase 4: Schema restructuring for manga_details
-- Step 1: Make title_id NOT NULL
ALTER TABLE manga_details ALTER COLUMN title_id SET NOT NULL;

-- Step 2: Drop the current primary key constraint
ALTER TABLE manga_details DROP CONSTRAINT manga_details_pkey;

-- Step 3: Add title_id as new primary key
ALTER TABLE manga_details ADD CONSTRAINT manga_details_pkey PRIMARY KEY (title_id);

-- Step 4: Drop the old id column and its index
DROP INDEX IF EXISTS idx_manga_details_id;
ALTER TABLE manga_details DROP COLUMN id;

-- Phase 5: Add performance indexes on the new structure
CREATE INDEX IF NOT EXISTS idx_anime_details_status ON anime_details(status);
CREATE INDEX IF NOT EXISTS idx_anime_details_last_sync ON anime_details(last_sync_check);
CREATE INDEX IF NOT EXISTS idx_manga_details_status ON manga_details(status);
CREATE INDEX IF NOT EXISTS idx_manga_details_last_sync ON manga_details(last_sync_check);

-- Phase 6: Update any triggers that might reference the old id columns
-- (Most of our existing triggers use title_id already, so minimal impact)

-- Add documentation comment
COMMENT ON TABLE anime_details IS 'Anime-specific details with title_id as primary key for 1:1 relationship with titles';
COMMENT ON TABLE manga_details IS 'Manga-specific details with title_id as primary key for 1:1 relationship with titles';

-- Final validation
DO $$
BEGIN
  -- Verify the new structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'anime_details' 
    AND constraint_type = 'PRIMARY KEY' 
    AND constraint_name = 'anime_details_pkey'
  ) THEN
    RAISE EXCEPTION 'anime_details primary key not properly set';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'manga_details' 
    AND constraint_type = 'PRIMARY KEY' 
    AND constraint_name = 'manga_details_pkey'
  ) THEN
    RAISE EXCEPTION 'manga_details primary key not properly set';
  END IF;
  
  RAISE NOTICE 'Schema migration completed successfully';
END $$;
