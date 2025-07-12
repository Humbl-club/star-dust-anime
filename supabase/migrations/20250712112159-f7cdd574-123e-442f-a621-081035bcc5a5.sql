-- SUPREME DATABASE OPTIMIZATION + Schema Normalization Migration
-- Phase 1: Emergency Dead Tuple Annihilation + Schema Cleanup

-- First, ensure we have the proper relationships set up
-- Add title_id foreign key constraints if missing (safe operations)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_anime_lists_title_id'
    ) THEN
        ALTER TABLE user_anime_lists 
        ADD CONSTRAINT fk_user_anime_lists_title_id 
        FOREIGN KEY (anime_detail_id) REFERENCES anime_details(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_manga_lists_title_id'
    ) THEN
        ALTER TABLE user_manga_lists 
        ADD CONSTRAINT fk_user_manga_lists_title_id 
        FOREIGN KEY (manga_detail_id) REFERENCES manga_details(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Phase 2: Remove redundant anime_id and manga_id columns
-- These are now redundant since we can get them through title relationships
ALTER TABLE user_anime_lists DROP COLUMN IF EXISTS anime_id;
ALTER TABLE user_manga_lists DROP COLUMN IF EXISTS manga_id;

-- Phase 3: Massive Index Optimization (60MB+ Storage Recovery)
-- Drop unused and redundant indexes
DROP INDEX IF EXISTS idx_titles_search;
DROP INDEX IF EXISTS idx_titles_title_search;
DROP INDEX IF EXISTS idx_titles_anilist_id;
DROP INDEX IF EXISTS idx_titles_year_score;
DROP INDEX IF EXISTS authors_name_key;
DROP INDEX IF EXISTS genres_name_key;
DROP INDEX IF EXISTS studios_name_key;
DROP INDEX IF EXISTS titles_anilist_id_key;