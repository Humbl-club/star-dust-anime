-- COMPREHENSIVE CLEANUP AND RECREATION
-- Step 1: Drop ALL existing tables including the ones we created earlier

-- Drop the temporary enhanced tables we created earlier
DROP TABLE IF EXISTS character_voice_actors CASCADE;
DROP TABLE IF EXISTS title_characters CASCADE;
DROP TABLE IF EXISTS title_people CASCADE;
DROP TABLE IF EXISTS title_studios_enhanced CASCADE;
DROP TABLE IF EXISTS title_tags CASCADE;
DROP TABLE IF EXISTS title_genres_enhanced CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS studios_enhanced CASCADE;
DROP TABLE IF EXISTS genres_new CASCADE;

-- Drop existing backup tables if they exist
DROP TABLE IF EXISTS backup_title_studios CASCADE;
DROP TABLE IF EXISTS backup_title_genres CASCADE;
DROP TABLE IF EXISTS backup_studios CASCADE;
DROP TABLE IF EXISTS backup_genres CASCADE;

-- Drop materialized views that depend on the tables
DROP MATERIALIZED VIEW IF EXISTS mv_popular_tags CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_popular_genres CASCADE;

-- Step 2: Create backup tables for any remaining data
CREATE TABLE IF NOT EXISTS backup_authors AS SELECT * FROM authors WHERE 1=1;
CREATE TABLE IF NOT EXISTS backup_title_authors AS SELECT * FROM title_authors WHERE 1=1;

-- Drop the old authors tables
DROP TABLE IF EXISTS title_authors CASCADE;
DROP TABLE IF EXISTS authors CASCADE;

-- Step 3: Now create the complete enhanced schema from scratch

-- 1. Enhanced Genres Table with Categorization
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
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

-- 3. Comprehensive Tags Table
CREATE TABLE public.tags (
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

-- 4. People Table (combines authors, directors, voice actors, etc.)
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