-- Remove duplicate unique constraints (not indexes) for better performance
-- These are actually constraints that create indexes automatically

-- Remove duplicate unique constraints on authors table
ALTER TABLE authors DROP CONSTRAINT IF EXISTS authors_name_key;
-- Keep: authors_name_unique, authors_pkey

-- Remove duplicate unique constraints on genres table  
ALTER TABLE genres DROP CONSTRAINT IF EXISTS genres_name_key;
-- Keep: genres_name_unique, genres_pkey

-- Remove duplicate unique constraints on studios table
ALTER TABLE studios DROP CONSTRAINT IF EXISTS studios_name_key;
-- Keep: studios_name_unique, studios_pkey

-- Remove duplicate unique constraints on titles table
ALTER TABLE titles DROP CONSTRAINT IF EXISTS titles_anilist_id_key;
-- Keep: titles_anilist_id_unique, titles_pkey

-- Add missing index for better search performance on titles
CREATE INDEX IF NOT EXISTS idx_titles_title_search ON titles USING GIN (
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(title_english, '') || ' ' || 
    COALESCE(title_japanese, '')
  )
);

-- Add index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_titles_year_score ON titles (year DESC, score DESC) WHERE year IS NOT NULL AND score IS NOT NULL;

-- Optimize user lists queries  
CREATE INDEX IF NOT EXISTS idx_user_anime_lists_updated ON user_anime_lists (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_manga_lists_updated ON user_manga_lists (updated_at DESC);