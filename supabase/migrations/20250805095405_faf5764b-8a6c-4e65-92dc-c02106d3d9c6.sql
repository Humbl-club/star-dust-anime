-- Create fuzzy search function for title matching
CREATE OR REPLACE FUNCTION public.find_fuzzy_title_matches(
  search_title TEXT,
  search_title_english TEXT DEFAULT NULL,
  search_title_japanese TEXT DEFAULT NULL,
  content_type_filter TEXT DEFAULT NULL,
  limit_results INTEGER DEFAULT 5,
  min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE(
  title_id UUID,
  title TEXT,
  title_english TEXT,
  title_japanese TEXT,
  content_type TEXT,
  similarity_score FLOAT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH title_similarities AS (
    SELECT 
      t.id as title_id,
      t.title,
      t.title_english,
      t.title_japanese,
      CASE 
        WHEN EXISTS (SELECT 1 FROM anime_details WHERE title_id = t.id) THEN 'anime'
        WHEN EXISTS (SELECT 1 FROM manga_details WHERE title_id = t.id) THEN 'manga'
        ELSE 'unknown'
      END as content_type,
      GREATEST(
        similarity(COALESCE(t.title, ''), search_title),
        CASE WHEN search_title_english IS NOT NULL THEN 
          similarity(COALESCE(t.title_english, ''), search_title_english) 
        ELSE 0 END,
        CASE WHEN search_title_japanese IS NOT NULL THEN 
          similarity(COALESCE(t.title_japanese, ''), search_title_japanese) 
        ELSE 0 END
      ) as similarity_score
    FROM titles t
    WHERE 
      (content_type_filter IS NULL OR 
       (content_type_filter = 'anime' AND EXISTS (SELECT 1 FROM anime_details WHERE title_id = t.id)) OR
       (content_type_filter = 'manga' AND EXISTS (SELECT 1 FROM manga_details WHERE title_id = t.id)))
  )
  SELECT 
    ts.title_id,
    ts.title,
    ts.title_english,
    ts.title_japanese,
    ts.content_type,
    ts.similarity_score
  FROM title_similarities ts
  WHERE ts.similarity_score >= min_similarity
  ORDER BY ts.similarity_score DESC
  LIMIT limit_results;
END;
$$;

-- Create function to safely insert title with details
CREATE OR REPLACE FUNCTION public.insert_title_with_details(
  title_data JSONB,
  anime_data JSONB DEFAULT NULL,
  manga_data JSONB DEFAULT NULL,
  genre_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  studio_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  author_names TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_title_id UUID;
  genre_id UUID;
  studio_id UUID;
  author_id UUID;
  genre_name TEXT;
  studio_name TEXT;
  author_name TEXT;
BEGIN
  -- Insert into titles table
  INSERT INTO titles (
    anilist_id, id_kitsu, title, title_english, title_japanese,
    synopsis, image_url, score, anilist_score, rank, popularity,
    year, color_theme, num_users_voted
  )
  SELECT 
    (title_data->>'anilist_id')::INTEGER,
    (title_data->>'id_kitsu')::INTEGER,
    title_data->>'title',
    title_data->>'title_english',
    title_data->>'title_japanese',
    title_data->>'synopsis',
    title_data->>'image_url',
    (title_data->>'score')::NUMERIC,
    (title_data->>'anilist_score')::NUMERIC,
    (title_data->>'rank')::INTEGER,
    (title_data->>'popularity')::INTEGER,
    (title_data->>'year')::INTEGER,
    title_data->>'color_theme',
    COALESCE((title_data->>'num_users_voted')::INTEGER, 0)
  RETURNING id INTO new_title_id;

  -- Insert anime details if provided
  IF anime_data IS NOT NULL THEN
    INSERT INTO anime_details (
      title_id, episodes, aired_from, aired_to, season, status, type,
      trailer_url, trailer_site, trailer_id, next_episode_date, 
      next_episode_number
    )
    SELECT 
      new_title_id,
      (anime_data->>'episodes')::INTEGER,
      (anime_data->>'aired_from')::DATE,
      (anime_data->>'aired_to')::DATE,
      anime_data->>'season',
      anime_data->>'status',
      anime_data->>'type',
      anime_data->>'trailer_url',
      anime_data->>'trailer_site',
      anime_data->>'trailer_id',
      (anime_data->>'next_episode_date')::TIMESTAMP WITH TIME ZONE,
      (anime_data->>'next_episode_number')::INTEGER;
  END IF;

  -- Insert manga details if provided  
  IF manga_data IS NOT NULL THEN
    INSERT INTO manga_details (
      title_id, chapters, volumes, published_from, published_to, 
      status, type, next_chapter_date, next_chapter_number
    )
    SELECT 
      new_title_id,
      (manga_data->>'chapters')::INTEGER,
      (manga_data->>'volumes')::INTEGER,
      (manga_data->>'published_from')::DATE,
      (manga_data->>'published_to')::DATE,
      manga_data->>'status',
      manga_data->>'type',
      (manga_data->>'next_chapter_date')::TIMESTAMP WITH TIME ZONE,
      (manga_data->>'next_chapter_number')::INTEGER;
  END IF;

  -- Handle genres
  FOREACH genre_name IN ARRAY genre_names LOOP
    -- Get or create genre
    INSERT INTO genres (name, type) 
    VALUES (genre_name, 'both') 
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO genre_id;
    
    IF genre_id IS NULL THEN
      SELECT id INTO genre_id FROM genres WHERE name = genre_name;
    END IF;

    -- Link to title
    INSERT INTO title_genres (title_id, genre_id) 
    VALUES (new_title_id, genre_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Handle studios (for anime)
  FOREACH studio_name IN ARRAY studio_names LOOP
    INSERT INTO studios (name) 
    VALUES (studio_name) 
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO studio_id;
    
    IF studio_id IS NULL THEN
      SELECT id INTO studio_id FROM studios WHERE name = studio_name;
    END IF;

    INSERT INTO title_studios (title_id, studio_id) 
    VALUES (new_title_id, studio_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Handle authors (for manga)
  FOREACH author_name IN ARRAY author_names LOOP
    INSERT INTO authors (name) 
    VALUES (author_name) 
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO author_id;
    
    IF author_id IS NULL THEN
      SELECT id INTO author_id FROM authors WHERE name = author_name;
    END IF;

    INSERT INTO title_authors (title_id, author_id) 
    VALUES (new_title_id, author_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN new_title_id;
END;
$$;