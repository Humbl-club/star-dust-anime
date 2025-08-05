-- Simple and safe enhancement that preserves existing functionality
-- Add the minimum necessary fields for enhanced functionality

-- 1. Add slug field to existing tables (safely)
ALTER TABLE public.genres ADD COLUMN slug TEXT;
ALTER TABLE public.studios ADD COLUMN slug TEXT;  
ALTER TABLE public.authors ADD COLUMN slug TEXT;

-- 2. Generate slugs from existing names
UPDATE public.genres 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

UPDATE public.studios 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

UPDATE public.authors 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- 3. Handle duplicates by adding incremental numbers
WITH ranked_genres AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM public.genres
)
UPDATE public.genres 
SET slug = CASE 
  WHEN ranked_genres.rn = 1 THEN ranked_genres.slug 
  ELSE ranked_genres.slug || '-' || ranked_genres.rn 
END
FROM ranked_genres
WHERE genres.id = ranked_genres.id;

WITH ranked_studios AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM public.studios
)
UPDATE public.studios 
SET slug = CASE 
  WHEN ranked_studios.rn = 1 THEN ranked_studios.slug 
  ELSE ranked_studios.slug || '-' || ranked_studios.rn 
END
FROM ranked_studios
WHERE studios.id = ranked_studios.id;

WITH ranked_authors AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM public.authors
)
UPDATE public.authors 
SET slug = CASE 
  WHEN ranked_authors.rn = 1 THEN ranked_authors.slug 
  ELSE ranked_authors.slug || '-' || ranked_authors.rn 
END
FROM ranked_authors
WHERE authors.id = ranked_authors.id;

-- 4. Create the new comprehensive tables that don't conflict
CREATE TABLE IF NOT EXISTS public.content_tags (
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

CREATE TABLE IF NOT EXISTS public.content_characters (
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

-- 5. Create enhanced relationship tables
CREATE TABLE IF NOT EXISTS public.title_content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
  rank INTEGER DEFAULT 0,
  votes INTEGER DEFAULT 0,
  is_spoiler BOOLEAN DEFAULT false,
  source TEXT CHECK (source IN ('anilist', 'kitsu', 'community', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.title_content_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES content_characters(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('main', 'supporting', 'background')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title_id, character_id)
);

-- 6. Add essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres(slug);
CREATE INDEX IF NOT EXISTS idx_studios_slug ON studios(slug);
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_content_tags_slug ON content_tags(slug);
CREATE INDEX IF NOT EXISTS idx_content_characters_slug ON content_characters(slug);