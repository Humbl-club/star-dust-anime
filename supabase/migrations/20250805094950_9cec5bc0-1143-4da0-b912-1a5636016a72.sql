-- Step 1: pg_trgm extension is already enabled

-- Step 2: Add Kitsu ID column to your central 'titles' table
-- (anilist_id already exists in your schema)
ALTER TABLE public.titles
  ADD COLUMN IF NOT EXISTS id_kitsu INT UNIQUE;

-- Step 3: Create GIN indexes on title columns for high-performance fuzzy searching
-- Your main title columns are 'title', 'title_english', and 'title_japanese'
CREATE INDEX IF NOT EXISTS idx_titles_title_trgm ON public.titles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_titles_title_english_trgm ON public.titles USING gin (title_english gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_titles_title_japanese_trgm ON public.titles USING gin (title_japanese gin_trgm_ops);

-- Step 4: Create composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_titles_score_popularity ON public.titles (score DESC NULLS LAST, popularity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_titles_year_score ON public.titles (year DESC NULLS LAST, score DESC NULLS LAST);