-- Enhanced Database Schema for Comprehensive Metadata Management
-- This schema provides rich, queryable relationships for all content metadata

-- ============================================
-- CORE ENTITY TABLES
-- ============================================

-- 1. Enhanced Genres Table with Categorization
CREATE TABLE IF NOT EXISTS public.genres_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly version
  description TEXT,
  category TEXT CHECK (category IN ('theme', 'demographic', 'genre', 'setting', 'format')),
  parent_genre_id UUID REFERENCES genres_new(id),
  is_adult BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enhanced Studios Table with Metadata
CREATE TABLE IF NOT EXISTS public.studios_enhanced (
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
CREATE TABLE IF NOT EXISTS public.tags (
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
CREATE TABLE IF NOT EXISTS public.people (
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
CREATE TABLE IF NOT EXISTS public.characters (
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

-- ============================================
-- RELATIONSHIP TABLES (Many-to-Many)
-- ============================================

-- 6. Enhanced Title-Genre Relationships with Relevance
CREATE TABLE IF NOT EXISTS public.title_genres_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres_new(id) ON DELETE CASCADE,
  relevance_score NUMERIC(3,2) DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  source TEXT CHECK (source IN ('anilist', 'kitsu', 'mal', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, genre_id)
);

-- 7. Title-Tag Relationships with Ranking
CREATE TABLE IF NOT EXISTS public.title_tags (
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

-- 8. Enhanced Title-Studio Relationships
CREATE TABLE IF NOT EXISTS public.title_studios_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios_enhanced(id) ON DELETE CASCADE,
  is_main_studio BOOLEAN DEFAULT false,
  role TEXT CHECK (role IN ('animation', 'production', 'distribution', 'licensing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, studio_id)
);

-- 9. Title-People Relationships (Authors for Manga, Staff for Anime)
CREATE TABLE IF NOT EXISTS public.title_people (
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
CREATE TABLE IF NOT EXISTS public.title_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('main', 'supporting', 'background')),
  order_index INTEGER DEFAULT 0, -- Display order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, character_id)
);

-- 11. Character-Voice Actor Relationships
CREATE TABLE IF NOT EXISTS public.character_voice_actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'Japanese',
  is_main BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, character_id, person_id, language)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Genre indexes
CREATE INDEX IF NOT EXISTS idx_genres_new_slug ON genres_new(slug);
CREATE INDEX IF NOT EXISTS idx_genres_new_category ON genres_new(category);
CREATE INDEX IF NOT EXISTS idx_genres_new_parent ON genres_new(parent_genre_id);

-- Studio indexes
CREATE INDEX IF NOT EXISTS idx_studios_enhanced_slug ON studios_enhanced(slug);
CREATE INDEX IF NOT EXISTS idx_studios_enhanced_animation ON studios_enhanced(is_animation_studio);

-- Tag indexes
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_rank ON tags(rank DESC);

-- People indexes
CREATE INDEX IF NOT EXISTS idx_people_slug ON people(slug);
CREATE INDEX IF NOT EXISTS idx_people_anilist ON people(anilist_id);

-- Character indexes
CREATE INDEX IF NOT EXISTS idx_characters_slug ON characters(slug);
CREATE INDEX IF NOT EXISTS idx_characters_anilist ON characters(anilist_id);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_title_genres_enhanced_title ON title_genres_enhanced(title_id);
CREATE INDEX IF NOT EXISTS idx_title_genres_enhanced_genre ON title_genres_enhanced(genre_id);
CREATE INDEX IF NOT EXISTS idx_title_genres_enhanced_relevance ON title_genres_enhanced(relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_title_tags_title ON title_tags(title_id);
CREATE INDEX IF NOT EXISTS idx_title_tags_tag ON title_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_title_tags_rank ON title_tags(rank DESC);

CREATE INDEX IF NOT EXISTS idx_title_studios_enhanced_title ON title_studios_enhanced(title_id);
CREATE INDEX IF NOT EXISTS idx_title_studios_enhanced_main ON title_studios_enhanced(is_main_studio);

CREATE INDEX IF NOT EXISTS idx_title_people_title ON title_people(title_id);
CREATE INDEX IF NOT EXISTS idx_title_people_person ON title_people(person_id);
CREATE INDEX IF NOT EXISTS idx_title_people_role ON title_people(role);