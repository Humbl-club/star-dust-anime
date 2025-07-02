-- Add missing anilist_id columns to existing tables
ALTER TABLE public.manga ADD COLUMN IF NOT EXISTS anilist_id INTEGER;

-- Create unique indexes for both anime and manga
CREATE UNIQUE INDEX IF NOT EXISTS idx_anime_anilist_unique ON public.anime(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_manga_anilist_unique ON public.manga(anilist_id) WHERE anilist_id IS NOT NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_manga_anilist_id ON public.manga(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anime_next_episode ON public.anime(next_episode_date) WHERE next_episode_date IS NOT NULL;