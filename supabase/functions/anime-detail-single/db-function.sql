
-- This SQL will be executed manually or through migrations
-- Database function to get anime detail with all relationships in one query
CREATE OR REPLACE FUNCTION get_anime_detail(anime_id_param uuid)
RETURNS TABLE (
  -- Title fields
  id uuid,
  anilist_id integer,
  title text,
  title_english text,
  title_japanese text,
  synopsis text,
  image_url text,
  score numeric,
  anilist_score numeric,
  rank integer,
  popularity integer,
  members integer,
  favorites integer,
  year integer,
  color_theme text,
  created_at timestamptz,
  updated_at timestamptz,
  -- Anime detail fields  
  episodes integer,
  aired_from date,
  aired_to date,
  season text,
  status text,
  type text,
  trailer_url text,
  trailer_site text,
  trailer_id text,
  next_episode_date timestamptz,
  next_episode_number integer,
  last_sync_check timestamptz,
  -- Aggregated relationships
  genres jsonb,
  studios jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.anilist_id,
    t.title,
    t.title_english,
    t.title_japanese,
    t.synopsis,
    t.image_url,
    t.score,
    t.anilist_score,
    t.rank,
    t.popularity,
    t.members,
    t.favorites,
    t.year,
    t.color_theme,
    t.created_at,
    t.updated_at,
    -- Anime details
    ad.episodes,
    ad.aired_from,
    ad.aired_to,
    ad.season,
    ad.status,
    ad.type,
    ad.trailer_url,
    ad.trailer_site,
    ad.trailer_id,
    ad.next_episode_date,
    ad.next_episode_number,
    ad.last_sync_check,
    -- Aggregated genres
    COALESCE(
      json_agg(DISTINCT g.*) FILTER (WHERE g.id IS NOT NULL),
      '[]'::json
    )::jsonb as genres,
    -- Aggregated studios
    COALESCE(
      json_agg(DISTINCT s.*) FILTER (WHERE s.id IS NOT NULL),
      '[]'::json
    )::jsonb as studios
  FROM titles t
  INNER JOIN anime_details ad ON t.id = ad.title_id
  LEFT JOIN title_genres tg ON t.id = tg.title_id
  LEFT JOIN genres g ON tg.genre_id = g.id AND g.type IN ('anime', 'both')
  LEFT JOIN title_studios ts ON t.id = ts.title_id
  LEFT JOIN studios s ON ts.studio_id = s.id
  WHERE t.id = anime_id_param
  GROUP BY t.id, ad.title_id, ad.episodes, ad.aired_from, ad.aired_to, 
           ad.season, ad.status, ad.type, ad.trailer_url, ad.trailer_site,
           ad.trailer_id, ad.next_episode_date, ad.next_episode_number, ad.last_sync_check;
$$;
