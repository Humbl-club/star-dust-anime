-- Step-by-step enhancement with proper checks
-- First, let's add the slug columns where they don't exist

-- 1. Add slug to authors if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'authors' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.authors ADD COLUMN slug TEXT;
  END IF;
END $$;

-- 2. Add slug to genres if it doesn't exist  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'genres' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.genres ADD COLUMN slug TEXT;
  END IF;
END $$;

-- 3. Add slug to studios if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'studios' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.studios ADD COLUMN slug TEXT;
  END IF;
END $$;

-- 4. Generate slugs for authors
UPDATE public.authors 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), '/', '-'))
WHERE slug IS NULL OR slug = '';

-- 5. Generate slugs for genres
UPDATE public.genres 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), '/', '-'))
WHERE slug IS NULL OR slug = '';

-- 6. Generate slugs for studios
UPDATE public.studios 
SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '&', 'and'), '/', '-'))
WHERE slug IS NULL OR slug = '';

-- 7. Handle duplicate slugs by appending numbers
-- For authors
WITH duplicate_authors AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM public.authors 
  WHERE slug IS NOT NULL
)
UPDATE public.authors 
SET slug = duplicate_authors.slug || '-' || duplicate_authors.rn
FROM duplicate_authors
WHERE authors.id = duplicate_authors.id 
  AND duplicate_authors.rn > 1;

-- For genres  
WITH duplicate_genres AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM public.genres 
  WHERE slug IS NOT NULL
)
UPDATE public.genres 
SET slug = duplicate_genres.slug || '-' || duplicate_genres.rn
FROM duplicate_genres
WHERE genres.id = duplicate_genres.id 
  AND duplicate_genres.rn > 1;

-- For studios
WITH duplicate_studios AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM public.studios 
  WHERE slug IS NOT NULL
)
UPDATE public.studios 
SET slug = duplicate_studios.slug || '-' || duplicate_studios.rn
FROM duplicate_studios
WHERE studios.id = duplicate_studios.id 
  AND duplicate_studios.rn > 1;

-- 8. Add unique constraints
ALTER TABLE public.authors ADD CONSTRAINT IF NOT EXISTS authors_slug_unique UNIQUE (slug);
ALTER TABLE public.genres ADD CONSTRAINT IF NOT EXISTS genres_slug_unique UNIQUE (slug);
ALTER TABLE public.studios ADD CONSTRAINT IF NOT EXISTS studios_slug_unique UNIQUE (slug);