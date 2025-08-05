-- COMPREHENSIVE ENHANCEMENT: Add new fields to existing tables and create new functionality
-- This preserves all existing data while adding enhanced capabilities

-- ============================================
-- ENHANCE EXISTING TABLES
-- ============================================

-- 1. Enhance genres table with new fields
ALTER TABLE public.genres 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('theme', 'demographic', 'genre', 'setting', 'format')),
ADD COLUMN IF NOT EXISTS parent_genre_id UUID REFERENCES genres(id),
ADD COLUMN IF NOT EXISTS is_adult BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create unique constraint on slug after populating it
-- First, generate slugs for existing genres
UPDATE public.genres 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), '/', '-'))
WHERE slug IS NULL;

-- Add unique constraint on slug
ALTER TABLE public.genres ADD CONSTRAINT genres_slug_unique UNIQUE (slug);

-- 2. Enhance studios table with new fields
ALTER TABLE public.studios 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS name_japanese TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS is_animation_studio BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Generate slugs for existing studios
UPDATE public.studios 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), '/', '-'))
WHERE slug IS NULL;

-- Add unique constraint on slug
ALTER TABLE public.studios ADD CONSTRAINT studios_slug_unique UNIQUE (slug);

-- 3. Enhance authors table by converting to general people table
-- Add new fields to authors (which will become our people table)
ALTER TABLE public.authors 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS name_japanese TEXT,
ADD COLUMN IF NOT EXISTS name_romanized TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS death_date DATE,
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS biography TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS anilist_id INTEGER UNIQUE,
ADD COLUMN IF NOT EXISTS mal_id INTEGER UNIQUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Generate slugs for existing authors
UPDATE public.authors 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), '/', '-'))
WHERE slug IS NULL;

-- Add unique constraint on slug
ALTER TABLE public.authors ADD CONSTRAINT authors_slug_unique UNIQUE (slug);

-- ============================================
-- CREATE NEW TABLES
-- ============================================

-- 4. Create comprehensive tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'content_warning', 'technical', 'narrative', 
    'aesthetic', 'demographic', 'theme', 'setting'
  )),
  rank INTEGER DEFAULT 0,
  is_spoiler BOOLEAN DEFAULT false,
  is_adult BOOLEAN DEFAULT false,
  anilist_id INTEGER UNIQUE,
  kitsu_id INTEGER UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create characters table
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_japanese TEXT,
  name_alternative JSONB DEFAULT '[]'::jsonb,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  role TEXT CHECK (role IN ('main', 'supporting', 'background')),
  anilist_id INTEGER UNIQUE,
  mal_id INTEGER UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENHANCE RELATIONSHIP TABLES
-- ============================================

-- 6. Enhance title_genres with new fields
ALTER TABLE public.title_genres 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS relevance_score NUMERIC(3,2) DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('anilist', 'kitsu', 'mal', 'manual')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add primary key if it doesn't exist
-- First check if we have a primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'title_genres' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.title_genres ADD PRIMARY KEY (title_id, genre_id);
  END IF;
END $$;

-- 7. Enhance title_studios with new fields
ALTER TABLE public.title_studios 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS is_main_studio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('animation', 'production', 'distribution', 'licensing')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add primary key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'title_studios' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.title_studios ADD PRIMARY KEY (title_id, studio_id);
  END IF;
END $$;