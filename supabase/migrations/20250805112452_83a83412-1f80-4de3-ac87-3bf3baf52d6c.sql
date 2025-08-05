-- Fix duplicate slug issues and complete the enhancement
-- First, handle existing duplicates by making slugs unique

-- 1. Fix duplicate slugs in authors table
WITH duplicate_slugs AS (
  SELECT slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM public.authors 
  WHERE slug IS NOT NULL
)
UPDATE public.authors 
SET slug = authors.slug || '-' || duplicate_slugs.rn
FROM duplicate_slugs
WHERE authors.slug = duplicate_slugs.slug 
  AND duplicate_slugs.rn > 1;

-- Add unique constraint on slug for authors
ALTER TABLE public.authors ADD CONSTRAINT authors_slug_unique UNIQUE (slug);

-- 2. Continue with enhancing title_authors table (rename to title_people for consistency)
-- But first, enhance the existing title_authors table
ALTER TABLE public.title_authors 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'author' CHECK (role IN (
  'author', 'artist', 'director', 'producer', 'writer', 
  'character_design', 'music', 'editor', 'translator'
)),
ADD COLUMN IF NOT EXISTS is_main_creator BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add primary key if it doesn't exist for title_authors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'title_authors' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.title_authors ADD PRIMARY KEY (title_id, author_id);
  END IF;
END $$;

-- ============================================
-- CREATE NEW RELATIONSHIP TABLES
-- ============================================

-- 8. Create title-tags relationship
CREATE TABLE IF NOT EXISTS public.title_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  rank INTEGER DEFAULT 0,
  votes INTEGER DEFAULT 0,
  is_spoiler BOOLEAN DEFAULT false,
  source TEXT CHECK (source IN ('anilist', 'kitsu', 'community', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, tag_id)
);

-- 9. Create title-character relationships
CREATE TABLE IF NOT EXISTS public.title_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('main', 'supporting', 'background')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, character_id)
);

-- 10. Create character-voice actor relationships (using authors as people)
CREATE TABLE IF NOT EXISTS public.character_voice_actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'Japanese',
  is_main BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, character_id, person_id, language)
);

-- ============================================
-- CREATE PERFORMANCE INDEXES
-- ============================================

-- Genre indexes
CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres(slug);
CREATE INDEX IF NOT EXISTS idx_genres_category ON genres(category);
CREATE INDEX IF NOT EXISTS idx_genres_parent ON genres(parent_genre_id);

-- Studio indexes
CREATE INDEX IF NOT EXISTS idx_studios_slug ON studios(slug);
CREATE INDEX IF NOT EXISTS idx_studios_animation ON studios(is_animation_studio);

-- Author indexes (people)
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_anilist ON authors(anilist_id);

-- Tag indexes
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_rank ON tags(rank DESC);

-- Character indexes
CREATE INDEX IF NOT EXISTS idx_characters_slug ON characters(slug);
CREATE INDEX IF NOT EXISTS idx_characters_anilist ON characters(anilist_id);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_title_genres_title ON title_genres(title_id);
CREATE INDEX IF NOT EXISTS idx_title_genres_genre ON title_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_title_genres_relevance ON title_genres(relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_title_tags_title ON title_tags(title_id);
CREATE INDEX IF NOT EXISTS idx_title_tags_tag ON title_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_title_tags_rank ON title_tags(rank DESC);

CREATE INDEX IF NOT EXISTS idx_title_studios_title ON title_studios(title_id);
CREATE INDEX IF NOT EXISTS idx_title_studios_main ON title_studios(is_main_studio);

CREATE INDEX IF NOT EXISTS idx_title_authors_title ON title_authors(title_id);
CREATE INDEX IF NOT EXISTS idx_title_authors_author ON title_authors(author_id);
CREATE INDEX IF NOT EXISTS idx_title_authors_role ON title_authors(role);