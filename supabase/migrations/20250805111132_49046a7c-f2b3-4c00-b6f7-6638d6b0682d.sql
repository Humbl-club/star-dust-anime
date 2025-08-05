-- COMPREHENSIVE MIGRATION: Replace existing tables with enhanced metadata schema
-- This migration will preserve existing data while upgrading the structure

-- Step 1: Backup existing data and drop old tables
-- First, let's create temporary backup tables for existing data
CREATE TABLE IF NOT EXISTS backup_genres AS SELECT * FROM genres;
CREATE TABLE IF NOT EXISTS backup_studios AS SELECT * FROM studios;
CREATE TABLE IF NOT EXISTS backup_title_genres AS SELECT * FROM title_genres;
CREATE TABLE IF NOT EXISTS backup_title_studios AS SELECT * FROM title_studios;

-- Step 2: Drop existing tables and their policies
DROP TABLE IF EXISTS title_studios CASCADE;
DROP TABLE IF EXISTS title_genres CASCADE;
DROP TABLE IF EXISTS studios CASCADE;
DROP TABLE IF EXISTS genres CASCADE;

-- Step 3: Create the enhanced schema with original table names
-- 1. Enhanced Genres Table with Categorization
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly version
  description TEXT,
  category TEXT CHECK (category IN ('theme', 'demographic', 'genre', 'setting', 'format')),
  parent_genre_id UUID REFERENCES genres(id),
  is_adult BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enhanced Studios Table with Metadata
CREATE TABLE public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_japanese TEXT,
  slug TEXT UNIQUE NOT NULL,
  founded_year INTEGER,
  description TEXT,
  website_url TEXT,
  is_animation_studio BOOLEAN DEFAULT true,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Comprehensive Tags Table (More granular than genres)
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'content_warning', 'technical', 'narrative', 
    'aesthetic', 'demographic', 'theme', 'setting'
  )),
  rank INTEGER DEFAULT 0, -- Relevance/popularity ranking
  is_spoiler BOOLEAN DEFAULT false,
  is_adult BOOLEAN DEFAULT false,
  anilist_id INTEGER UNIQUE,
  kitsu_id INTEGER UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. People Table (Authors, Directors, Voice Actors, etc.)
CREATE TABLE public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_japanese TEXT,
  name_romanized TEXT,
  slug TEXT UNIQUE NOT NULL,
  birth_date DATE,
  death_date DATE,
  birth_place TEXT,
  biography TEXT,
  image_url TEXT,
  website_url TEXT,
  anilist_id INTEGER UNIQUE,
  mal_id INTEGER UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Characters Table
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_japanese TEXT,
  name_alternative JSONB DEFAULT '[]'::jsonb, -- Array of alternative names
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  role TEXT CHECK (role IN ('main', 'supporting', 'background')),
  anilist_id INTEGER UNIQUE,
  mal_id INTEGER UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create enhanced relationship tables
-- 6. Title-Genre Relationships with Relevance
CREATE TABLE public.title_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  relevance_score NUMERIC(3,2) DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  source TEXT CHECK (source IN ('anilist', 'kitsu', 'mal', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, genre_id)
);

-- 7. Title-Tag Relationships with Ranking
CREATE TABLE public.title_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  rank INTEGER DEFAULT 0, -- How relevant this tag is (0-100)
  votes INTEGER DEFAULT 0, -- Community votes for this tag
  is_spoiler BOOLEAN DEFAULT false,
  source TEXT CHECK (source IN ('anilist', 'kitsu', 'community', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, tag_id)
);

-- 8. Title-Studio Relationships
CREATE TABLE public.title_studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  is_main_studio BOOLEAN DEFAULT false,
  role TEXT CHECK (role IN ('animation', 'production', 'distribution', 'licensing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, studio_id)
);

-- 9. Title-People Relationships (Authors for Manga, Staff for Anime)
CREATE TABLE public.title_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'author', 'artist', 'director', 'producer', 'writer', 
    'character_design', 'music', 'editor', 'translator'
  )),
  is_main_creator BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, person_id, role)
);

-- 10. Title-Character Relationships
CREATE TABLE public.title_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('main', 'supporting', 'background')),
  order_index INTEGER DEFAULT 0, -- Display order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, character_id)
);

-- 11. Character-Voice Actor Relationships
CREATE TABLE public.character_voice_actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'Japanese',
  is_main BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, character_id, person_id, language)
);

-- Step 5: Migrate existing data to new schema
-- Convert and migrate genres data
INSERT INTO genres (name, slug, created_at)
SELECT 
  name,
  LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and')) as slug,
  NOW()
FROM backup_genres
WHERE name IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Convert and migrate studios data  
INSERT INTO studios (name, slug, created_at)
SELECT 
  name,
  LOWER(REPLACE(REPLACE(name, ' ', '-'), '&', 'and')) as slug,
  NOW()
FROM backup_studios
WHERE name IS NOT NULL
ON CONFLICT (slug) DO NOTHING;