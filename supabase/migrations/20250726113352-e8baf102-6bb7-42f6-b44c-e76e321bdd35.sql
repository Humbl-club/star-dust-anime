-- Add content_type column to titles table for efficient filtering
ALTER TABLE public.titles 
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Update content_type based on existing data
UPDATE public.titles 
SET content_type = 'anime' 
WHERE id IN (SELECT title_id FROM anime_details);

UPDATE public.titles 
SET content_type = 'manga' 
WHERE id IN (SELECT title_id FROM manga_details);

-- Add constraint to ensure content_type is valid
ALTER TABLE public.titles 
ADD CONSTRAINT check_content_type 
CHECK (content_type IN ('anime', 'manga'));

-- Create optimized indexes for the new query pattern
CREATE INDEX IF NOT EXISTS idx_titles_content_type ON public.titles(content_type);
CREATE INDEX IF NOT EXISTS idx_titles_content_type_score ON public.titles(content_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_titles_content_type_year ON public.titles(content_type, year DESC);
CREATE INDEX IF NOT EXISTS idx_titles_content_type_popularity ON public.titles(content_type, popularity DESC);

-- Full-text search index for efficient searching
CREATE INDEX IF NOT EXISTS idx_titles_fts ON public.titles 
USING GIN (to_tsvector('english', title || ' ' || COALESCE(title_english, '') || ' ' || COALESCE(title_japanese, '')));

-- Composite indexes for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_anime_details_status_type ON public.anime_details(status, type);
CREATE INDEX IF NOT EXISTS idx_manga_details_status_type ON public.manga_details(status, type);

-- Index for genre filtering
CREATE INDEX IF NOT EXISTS idx_title_genres_genre_id ON public.title_genres(genre_id);

-- Add missing foreign key constraints if they don't exist
ALTER TABLE public.anime_details 
ADD CONSTRAINT IF NOT EXISTS fk_anime_details_title_id 
FOREIGN KEY (title_id) REFERENCES public.titles(id) ON DELETE CASCADE;

ALTER TABLE public.manga_details 
ADD CONSTRAINT IF NOT EXISTS fk_manga_details_title_id 
FOREIGN KEY (title_id) REFERENCES public.titles(id) ON DELETE CASCADE;