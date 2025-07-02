-- Add AniList enhanced fields to anime table
ALTER TABLE public.anime 
ADD COLUMN anilist_id INTEGER,
ADD COLUMN banner_image TEXT,
ADD COLUMN cover_image_large TEXT,
ADD COLUMN cover_image_extra_large TEXT,
ADD COLUMN color_theme TEXT,
ADD COLUMN anilist_score NUMERIC,
ADD COLUMN trailer_id TEXT,
ADD COLUMN trailer_site TEXT,
ADD COLUMN characters_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN staff_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN external_links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN streaming_episodes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN detailed_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN relations_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN recommendations_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN studios_data JSONB DEFAULT '[]'::jsonb;

-- Create index for faster AniList ID lookups
CREATE INDEX idx_anime_anilist_id ON public.anime(anilist_id);
CREATE INDEX idx_anime_mal_anilist ON public.anime(mal_id, anilist_id);