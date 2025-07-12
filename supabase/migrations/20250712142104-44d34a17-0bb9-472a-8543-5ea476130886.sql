
-- Enhanced migration with better error handling and dependency cleanup
DO $$
BEGIN
  -- First, let's check what dependencies exist on the id columns
  RAISE NOTICE 'Checking dependencies for anime_details.id and manga_details.id...';
  
  -- Check for any foreign key constraints referencing anime_details.id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE kcu.column_name = 'id' 
    AND kcu.table_name = 'anime_details'
    AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE NOTICE 'Found foreign key constraints on anime_details.id';
  END IF;
  
  -- Check for any foreign key constraints referencing manga_details.id  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE kcu.column_name = 'id' 
    AND kcu.table_name = 'manga_details'
    AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE NOTICE 'Found foreign key constraints on manga_details.id';
  END IF;
END $$;

-- Step 1: Drop any foreign key constraints that reference the old id columns
-- Check user_anime_lists table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_anime_lists_anime_detail_id_fkey'
  ) THEN
    ALTER TABLE user_anime_lists DROP CONSTRAINT user_anime_lists_anime_detail_id_fkey;
    RAISE NOTICE 'Dropped user_anime_lists_anime_detail_id_fkey constraint';
  END IF;
END $$;

-- Check user_manga_lists table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_manga_lists_manga_detail_id_fkey'
  ) THEN
    ALTER TABLE user_manga_lists DROP CONSTRAINT user_manga_lists_manga_detail_id_fkey;
    RAISE NOTICE 'Dropped user_manga_lists_manga_detail_id_fkey constraint';
  END IF;
END $$;

-- Step 2: Drop any other referencing columns
DO $$
BEGIN
  -- Drop anime_detail_id column from user_anime_lists if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_anime_lists' AND column_name = 'anime_detail_id'
  ) THEN
    ALTER TABLE user_anime_lists DROP COLUMN anime_detail_id;
    RAISE NOTICE 'Dropped anime_detail_id column from user_anime_lists';
  END IF;
  
  -- Drop manga_detail_id column from user_manga_lists if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_manga_lists' AND column_name = 'manga_detail_id'
  ) THEN
    ALTER TABLE user_manga_lists DROP COLUMN manga_detail_id;
    RAISE NOTICE 'Dropped manga_detail_id column from user_manga_lists';
  END IF;
END $$;

-- Step 3: Now safely restructure anime_details
DO $$
BEGIN
  -- Ensure title_id has foreign key constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'anime_details_title_id_fkey'
  ) THEN
    ALTER TABLE anime_details 
    ADD CONSTRAINT anime_details_title_id_fkey 
    FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint to anime_details.title_id';
  END IF;
  
  -- Make title_id NOT NULL if it isn't already
  ALTER TABLE anime_details ALTER COLUMN title_id SET NOT NULL;
  
  -- Drop existing primary key
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'anime_details' 
    AND constraint_type = 'PRIMARY KEY'
    AND constraint_name = 'anime_details_pkey'
  ) THEN
    ALTER TABLE anime_details DROP CONSTRAINT anime_details_pkey;
    RAISE NOTICE 'Dropped old anime_details primary key';
  END IF;
  
  -- Add new primary key
  ALTER TABLE anime_details ADD CONSTRAINT anime_details_pkey PRIMARY KEY (title_id);
  RAISE NOTICE 'Added new anime_details primary key on title_id';
  
  -- Drop the old id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anime_details' AND column_name = 'id'
  ) THEN
    ALTER TABLE anime_details DROP COLUMN id;
    RAISE NOTICE 'Dropped id column from anime_details';
  END IF;
END $$;

-- Step 4: Now safely restructure manga_details  
DO $$
BEGIN
  -- Ensure title_id has foreign key constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'manga_details_title_id_fkey'
  ) THEN
    ALTER TABLE manga_details 
    ADD CONSTRAINT manga_details_title_id_fkey 
    FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint to manga_details.title_id';
  END IF;
  
  -- Make title_id NOT NULL if it isn't already
  ALTER TABLE manga_details ALTER COLUMN title_id SET NOT NULL;
  
  -- Drop existing primary key
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'manga_details' 
    AND constraint_type = 'PRIMARY KEY'
    AND constraint_name = 'manga_details_pkey'
  ) THEN
    ALTER TABLE manga_details DROP CONSTRAINT manga_details_pkey;
    RAISE NOTICE 'Dropped old manga_details primary key';
  END IF;
  
  -- Add new primary key
  ALTER TABLE manga_details ADD CONSTRAINT manga_details_pkey PRIMARY KEY (title_id);
  RAISE NOTICE 'Added new manga_details primary key on title_id';
  
  -- Drop the old id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'manga_details' AND column_name = 'id'
  ) THEN
    ALTER TABLE manga_details DROP COLUMN id;
    RAISE NOTICE 'Dropped id column from manga_details';
  END IF;
END $$;

-- Step 5: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_anime_details_status ON anime_details(status);
CREATE INDEX IF NOT EXISTS idx_anime_details_last_sync ON anime_details(last_sync_check);
CREATE INDEX IF NOT EXISTS idx_manga_details_status ON manga_details(status);  
CREATE INDEX IF NOT EXISTS idx_manga_details_last_sync ON manga_details(last_sync_check);

-- Step 6: Final validation
DO $$
BEGIN
  -- Verify anime_details structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'anime_details' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    RAISE EXCEPTION 'anime_details does not have a primary key';
  END IF;
  
  -- Verify manga_details structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'manga_details' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    RAISE EXCEPTION 'manga_details does not have a primary key';
  END IF;
  
  -- Verify id columns are gone
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anime_details' AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'anime_details still has id column';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'manga_details' AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'manga_details still has id column';
  END IF;
  
  RAISE NOTICE 'Migration completed successfully - id columns removed, title_id is now primary key';
END $$;
