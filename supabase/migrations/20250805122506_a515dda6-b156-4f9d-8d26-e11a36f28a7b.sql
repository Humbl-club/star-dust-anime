-- Create missing tables for enhanced data population strategy

-- Add missing columns to existing tables
ALTER TABLE studios ADD COLUMN IF NOT EXISTS anilist_id INTEGER;
ALTER TABLE people ADD COLUMN IF NOT EXISTS anilist_id INTEGER;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS anilist_id INTEGER;

-- Create title_people table for general staff relationships
CREATE TABLE IF NOT EXISTS public.title_people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_id UUID NOT NULL,
  person_id UUID NOT NULL,
  role TEXT NOT NULL,
  is_main_creator BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(title_id, person_id, role)
);

-- Enable RLS for title_people
ALTER TABLE public.title_people ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for title_people
CREATE POLICY "Public read title_people" 
ON public.title_people 
FOR SELECT 
USING (true);

CREATE POLICY "Service write title_people" 
ON public.title_people 
FOR ALL 
USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_studios_anilist_id ON studios(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_anilist_id ON people(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_characters_anilist_id ON characters(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_title_people_title_id ON title_people(title_id);
CREATE INDEX IF NOT EXISTS idx_title_people_person_id ON title_people(person_id);
CREATE INDEX IF NOT EXISTS idx_title_people_role ON title_people(role);

-- Add missing columns to titles table for tracking updates
ALTER TABLE titles ADD COLUMN IF NOT EXISTS last_anilist_update TIMESTAMP WITH TIME ZONE;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS last_kitsu_update TIMESTAMP WITH TIME ZONE;

-- Create indexes for update tracking
CREATE INDEX IF NOT EXISTS idx_titles_last_anilist_update ON titles(last_anilist_update) WHERE last_anilist_update IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_titles_last_kitsu_update ON titles(last_kitsu_update) WHERE last_kitsu_update IS NOT NULL;