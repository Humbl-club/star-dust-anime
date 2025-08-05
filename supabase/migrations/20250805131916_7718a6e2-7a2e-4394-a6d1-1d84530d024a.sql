-- Create comprehensive get_title_metadata function
CREATE OR REPLACE FUNCTION public.get_title_metadata(title_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
  title_record RECORD;
  genres_json JSONB;
  tags_json JSONB;
  studios_json JSONB;
  creators_json JSONB;
  characters_json JSONB;
BEGIN
  -- Get the title record to verify it exists
  SELECT * INTO title_record FROM titles WHERE id = title_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'genres', '[]'::jsonb,
      'tags', '[]'::jsonb,
      'studios', '[]'::jsonb,
      'creators', '[]'::jsonb,
      'characters', '[]'::jsonb
    );
  END IF;

  -- Get genres with enhanced information
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'slug', COALESCE(g.slug, lower(replace(g.name, ' ', '-'))),
        'category', COALESCE(g.type, 'genre'),
        'relevance', 1.0
      )
    ) FILTER (WHERE g.id IS NOT NULL),
    '[]'::jsonb
  ) INTO genres_json
  FROM title_genres tg
  JOIN genres g ON tg.genre_id = g.id
  WHERE tg.title_id = title_id_param;

  -- Get tags with detailed information (using existing content_tags)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ct.id,
        'name', ct.name,
        'slug', COALESCE(ct.slug, lower(replace(ct.name, ' ', '-'))),
        'category', COALESCE(ct.category, 'general'),
        'rank', COALESCE(ct.rank, 0),
        'votes', 0, -- Placeholder for future voting system
        'is_spoiler', COALESCE(ct.is_spoiler, false)
      ) ORDER BY ct.rank DESC
    ) FILTER (WHERE ct.id IS NOT NULL),
    '[]'::jsonb
  ) INTO tags_json
  FROM content_tags ct
  WHERE ct.id IN (
    -- For now, return empty tags until title_tags junction table is properly set up
    SELECT NULL::UUID LIMIT 0
  );

  -- Get studios with role information
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'slug', COALESCE(s.slug, lower(replace(s.name, ' ', '-'))),
        'is_main', true, -- Default to main for now
        'role', 'animation' -- Default role
      )
    ) FILTER (WHERE s.id IS NOT NULL),
    '[]'::jsonb
  ) INTO studios_json
  FROM title_studios ts
  JOIN studios s ON ts.studio_id = s.id
  WHERE ts.title_id = title_id_param;

  -- Get creators/authors with role information
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'slug', COALESCE(a.slug, lower(replace(a.name, ' ', '-'))),
        'role', 'author',
        'is_main', true
      )
    ) FILTER (WHERE a.id IS NOT NULL),
    '[]'::jsonb
  ) INTO creators_json
  FROM title_authors ta
  JOIN authors a ON ta.author_id = a.id
  WHERE ta.title_id = title_id_param;

  -- Get characters with voice actors (if any)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'slug', COALESCE(c.slug, lower(replace(c.name, ' ', '-'))),
        'role', COALESCE(c.role, 'main'),
        'order', 0,
        'voice_actors', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'language', COALESCE(cva.language, 'Japanese')
              )
            )
            FROM character_voice_actors cva
            JOIN people p ON cva.person_id = p.id
            WHERE cva.character_id = c.id AND cva.title_id = title_id_param
          ),
          '[]'::jsonb
        )
      )
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::jsonb
  ) INTO characters_json
  FROM characters c
  WHERE EXISTS (
    SELECT 1 FROM character_voice_actors cva 
    WHERE cva.character_id = c.id AND cva.title_id = title_id_param
  );

  -- Build final result
  result := jsonb_build_object(
    'genres', genres_json,
    'tags', tags_json,
    'studios', studios_json,
    'creators', creators_json,
    'characters', characters_json
  );

  RETURN result;
END;
$$;

-- Create metadata search function
CREATE OR REPLACE FUNCTION public.search_titles_by_metadata(
  genre_slugs TEXT[] DEFAULT NULL,
  tag_slugs TEXT[] DEFAULT NULL,
  studio_slugs TEXT[] DEFAULT NULL,
  creator_slugs TEXT[] DEFAULT NULL,
  content_type TEXT DEFAULT NULL,
  limit_results INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  title_english TEXT,
  title_japanese TEXT,
  synopsis TEXT,
  image_url TEXT,
  score NUMERIC,
  year INTEGER,
  content_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_titles AS (
    SELECT DISTINCT
      t.id,
      t.title,
      t.title_english,
      t.title_japanese,
      t.synopsis,
      t.image_url,
      t.score,
      t.year,
      CASE 
        WHEN EXISTS (SELECT 1 FROM anime_details WHERE title_id = t.id) THEN 'anime'
        WHEN EXISTS (SELECT 1 FROM manga_details WHERE title_id = t.id) THEN 'manga'
        ELSE 'unknown'
      END as content_type
    FROM titles t
    WHERE 
      -- Filter by content type if specified
      (content_type IS NULL OR (
        (content_type = 'anime' AND EXISTS (SELECT 1 FROM anime_details WHERE title_id = t.id)) OR
        (content_type = 'manga' AND EXISTS (SELECT 1 FROM manga_details WHERE title_id = t.id))
      ))
      AND
      -- Filter by genres if specified
      (genre_slugs IS NULL OR EXISTS (
        SELECT 1 FROM title_genres tg
        JOIN genres g ON tg.genre_id = g.id
        WHERE tg.title_id = t.id 
        AND (g.slug = ANY(genre_slugs) OR g.name = ANY(genre_slugs))
      ))
      AND
      -- Filter by studios if specified  
      (studio_slugs IS NULL OR EXISTS (
        SELECT 1 FROM title_studios ts
        JOIN studios s ON ts.studio_id = s.id
        WHERE ts.title_id = t.id 
        AND (s.slug = ANY(studio_slugs) OR s.name = ANY(studio_slugs))
      ))
      AND
      -- Filter by creators if specified
      (creator_slugs IS NULL OR EXISTS (
        SELECT 1 FROM title_authors ta
        JOIN authors a ON ta.author_id = a.id
        WHERE ta.title_id = t.id 
        AND (a.slug = ANY(creator_slugs) OR a.name = ANY(creator_slugs))
      ))
  )
  SELECT 
    ft.id,
    ft.title,
    ft.title_english,
    ft.title_japanese,
    ft.synopsis,
    ft.image_url,
    ft.score,
    ft.year,
    ft.content_type
  FROM filtered_titles ft
  ORDER BY ft.score DESC NULLS LAST, ft.title
  LIMIT limit_results;
END;
$$;

-- Create indexes on existing tables for better metadata queries
CREATE INDEX IF NOT EXISTS idx_genres_slug ON public.genres(slug);
CREATE INDEX IF NOT EXISTS idx_studios_slug ON public.studios(slug);
CREATE INDEX IF NOT EXISTS idx_authors_slug ON public.authors(slug);
CREATE INDEX IF NOT EXISTS idx_content_tags_slug ON public.content_tags(slug);
CREATE INDEX IF NOT EXISTS idx_content_tags_name ON public.content_tags(name);

-- Add slugs to existing records where missing (use names as basis)
UPDATE public.genres 
SET slug = lower(replace(name, ' ', '-')) 
WHERE slug IS NULL OR slug = '';

UPDATE public.studios 
SET slug = lower(replace(name, ' ', '-')) 
WHERE slug IS NULL OR slug = '';

UPDATE public.authors 
SET slug = lower(replace(name, ' ', '-')) 
WHERE slug IS NULL OR slug = '';

UPDATE public.content_tags 
SET slug = lower(replace(name, ' ', '-')) 
WHERE slug IS NULL OR slug = '';