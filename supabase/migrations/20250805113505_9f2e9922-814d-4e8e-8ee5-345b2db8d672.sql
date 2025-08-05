-- Add unique constraints with proper error handling
DO $$
BEGIN
  -- Add unique constraint for authors slug
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'authors' AND constraint_name = 'authors_slug_unique'
  ) THEN
    ALTER TABLE public.authors ADD CONSTRAINT authors_slug_unique UNIQUE (slug);
  END IF;
END $$;

DO $$
BEGIN
  -- Add unique constraint for genres slug
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'genres' AND constraint_name = 'genres_slug_unique'
  ) THEN
    ALTER TABLE public.genres ADD CONSTRAINT genres_slug_unique UNIQUE (slug);
  END IF;
END $$;

DO $$
BEGIN
  -- Add unique constraint for studios slug
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'studios' AND constraint_name = 'studios_slug_unique'
  ) THEN
    ALTER TABLE public.studios ADD CONSTRAINT studios_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- Now add all the enhanced fields we missed earlier
-- Add enhanced fields to authors (people table)
ALTER TABLE public.authors 
ADD COLUMN IF NOT EXISTS name_japanese TEXT,
ADD COLUMN IF NOT EXISTS name_romanized TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS death_date DATE,
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS biography TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS anilist_id INTEGER,
ADD COLUMN IF NOT EXISTS mal_id INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add enhanced fields to genres
ALTER TABLE public.genres 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('theme', 'demographic', 'genre', 'setting', 'format')),
ADD COLUMN IF NOT EXISTS parent_genre_id UUID REFERENCES genres(id),
ADD COLUMN IF NOT EXISTS is_adult BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add enhanced fields to studios
ALTER TABLE public.studios 
ADD COLUMN IF NOT EXISTS name_japanese TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS is_animation_studio BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create unique constraints for anilist_id and mal_id if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'authors' AND constraint_name = 'authors_anilist_id_unique'
  ) THEN
    ALTER TABLE public.authors ADD CONSTRAINT authors_anilist_id_unique UNIQUE (anilist_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'authors' AND constraint_name = 'authors_mal_id_unique'
  ) THEN
    ALTER TABLE public.authors ADD CONSTRAINT authors_mal_id_unique UNIQUE (mal_id);
  END IF;
END $$;