-- Fix duplicate key constraint issues and enhance metadata schema
-- Step 1: Drop existing problematic constraints if they exist
ALTER TABLE IF EXISTS title_studios DROP CONSTRAINT IF EXISTS title_studios_pkey;
ALTER TABLE IF EXISTS title_authors DROP CONSTRAINT IF EXISTS title_authors_pkey;
ALTER TABLE IF EXISTS title_genres DROP CONSTRAINT IF EXISTS title_genres_pkey;

-- Create proper composite primary keys to prevent duplicates
ALTER TABLE title_studios ADD PRIMARY KEY (title_id, studio_id);
ALTER TABLE title_authors ADD PRIMARY KEY (title_id, author_id);
ALTER TABLE title_genres ADD PRIMARY KEY (title_id, genre_id);

-- Ensure all studios have slugs for metadata functionality
UPDATE studios 
SET slug = COALESCE(slug, lower(replace(replace(replace(name, ' ', '-'), '.', ''), ',', '')))
WHERE slug IS NULL OR slug = '';

-- Ensure all authors have slugs
UPDATE authors 
SET slug = COALESCE(slug, lower(replace(replace(replace(name, ' ', '-'), '.', ''), ',', '')))
WHERE slug IS NULL OR slug = '';

-- Ensure all genres have slugs
UPDATE genres 
SET slug = COALESCE(slug, lower(replace(replace(replace(name, ' ', '-'), '.', ''), ',', '')))
WHERE slug IS NULL OR slug = '';

-- Add indexes for better metadata performance
CREATE INDEX IF NOT EXISTS idx_titles_metadata_search ON titles USING GIN(to_tsvector('english', title || ' ' || COALESCE(title_english, '') || ' ' || COALESCE(title_japanese, '')));
CREATE INDEX IF NOT EXISTS idx_studios_slug ON studios(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres(slug) WHERE slug IS NOT NULL;

-- Create metadata performance tracking
CREATE TABLE IF NOT EXISTS metadata_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- 'anilist', 'kitsu', 'manual'
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Add RLS for metadata sync status
ALTER TABLE metadata_sync_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages metadata sync" ON metadata_sync_status FOR ALL USING (true);

-- Clean up any duplicate entries in junction tables
WITH duplicates AS (
  SELECT title_id, studio_id, MIN(ctid) as keep_ctid
  FROM title_studios 
  GROUP BY title_id, studio_id 
  HAVING COUNT(*) > 1
)
DELETE FROM title_studios 
WHERE ctid NOT IN (SELECT keep_ctid FROM duplicates)
AND (title_id, studio_id) IN (SELECT title_id, studio_id FROM duplicates);

WITH duplicates AS (
  SELECT title_id, author_id, MIN(ctid) as keep_ctid
  FROM title_authors 
  GROUP BY title_id, author_id 
  HAVING COUNT(*) > 1
)
DELETE FROM title_authors 
WHERE ctid NOT IN (SELECT keep_ctid FROM duplicates)
AND (title_id, author_id) IN (SELECT title_id, author_id FROM duplicates);

WITH duplicates AS (
  SELECT title_id, genre_id, MIN(ctid) as keep_ctid
  FROM title_genres 
  GROUP BY title_id, genre_id 
  HAVING COUNT(*) > 1
)
DELETE FROM title_genres 
WHERE ctid NOT IN (SELECT keep_ctid FROM duplicates)
AND (title_id, genre_id) IN (SELECT title_id, genre_id FROM duplicates);