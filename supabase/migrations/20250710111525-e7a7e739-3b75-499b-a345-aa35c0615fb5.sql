-- Remove duplicate unique constraints and indexes for better performance
-- Keep only the necessary indexes

-- Remove duplicate unique constraints on authors table
DROP INDEX IF EXISTS authors_name_key;
-- Keep: authors_name_unique, authors_pkey

-- Remove duplicate unique constraints on genres table  
DROP INDEX IF EXISTS genres_name_key;
-- Keep: genres_name_unique, genres_pkey

-- Remove duplicate unique constraints on studios table
DROP INDEX IF EXISTS studios_name_key;
-- Keep: studios_name_unique, studios_pkey

-- Remove duplicate unique constraints on titles table
DROP INDEX IF EXISTS titles_anilist_id_key;
-- Keep: titles_anilist_id_unique, titles_pkey

-- Remove duplicate unique constraints on username_pool table
DROP INDEX IF EXISTS username_pool_name_key;
-- Keep: username_pool_pkey and the name should be unique

-- Optimize search performance by ensuring proper full-text search index exists
-- The idx_titles_search already exists with GIN index for full-text search

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

-- Add composite index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_titles_type_status ON titles (id) 
  WHERE image_url IS NOT NULL AND synopsis IS NOT NULL;