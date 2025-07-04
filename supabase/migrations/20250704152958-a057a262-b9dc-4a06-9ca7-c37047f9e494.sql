-- Add TMDB-related columns to anime table
ALTER TABLE public.anime ADD COLUMN tmdb_id INTEGER;
ALTER TABLE public.anime ADD COLUMN tmdb_type TEXT;
ALTER TABLE public.anime ADD COLUMN tmdb_poster_path TEXT;
ALTER TABLE public.anime ADD COLUMN tmdb_backdrop_path TEXT;
ALTER TABLE public.anime ADD COLUMN tmdb_overview TEXT;
ALTER TABLE public.anime ADD COLUMN tmdb_vote_average NUMERIC;
ALTER TABLE public.anime ADD COLUMN tmdb_vote_count INTEGER;
ALTER TABLE public.anime ADD COLUMN tmdb_popularity NUMERIC;
ALTER TABLE public.anime ADD COLUMN tmdb_genre_ids INTEGER[];
ALTER TABLE public.anime ADD COLUMN tmdb_cast_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.anime ADD COLUMN tmdb_crew_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.anime ADD COLUMN tmdb_details JSONB DEFAULT '{}'::jsonb;

-- Create index for TMDB ID for faster lookups
CREATE INDEX IF NOT EXISTS idx_anime_tmdb_id ON public.anime(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_anime_tmdb_type ON public.anime(tmdb_type);

-- Create index on TMDB cast and crew data for JSON queries
CREATE INDEX IF NOT EXISTS idx_anime_tmdb_cast_data ON public.anime USING GIN(tmdb_cast_data);
CREATE INDEX IF NOT EXISTS idx_anime_tmdb_crew_data ON public.anime USING GIN(tmdb_crew_data);