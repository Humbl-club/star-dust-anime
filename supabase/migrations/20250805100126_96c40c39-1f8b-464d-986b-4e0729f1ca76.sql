-- Add the missing id_kitsu column to titles table
ALTER TABLE public.titles 
ADD COLUMN IF NOT EXISTS id_kitsu INT UNIQUE;

-- Create GIN index on the title column for fuzzy searching
CREATE INDEX IF NOT EXISTS idx_titles_title_trgm 
ON public.titles USING gin (title gin_trgm_ops);

-- Also create indexes on the other title fields for comprehensive searching
CREATE INDEX IF NOT EXISTS idx_titles_english_trgm 
ON public.titles USING gin (title_english gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_titles_japanese_trgm 
ON public.titles USING gin (title_japanese gin_trgm_ops);