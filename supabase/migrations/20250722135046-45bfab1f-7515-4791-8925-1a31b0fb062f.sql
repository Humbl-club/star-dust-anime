-- Create optimized RPC functions for home page data fetching

-- Get trending anime (high score + popularity)
CREATE OR REPLACE FUNCTION public.get_trending_anime(limit_param integer DEFAULT 20)
RETURNS TABLE(
  id uuid, anilist_id integer, title text, title_english text, title_japanese text,
  synopsis text, image_url text, score numeric, anilist_score numeric, rank integer,
  popularity integer, year integer, color_theme text, created_at timestamp with time zone,
  updated_at timestamp with time zone, episodes integer, aired_from date, aired_to date,
  season text, status text, type text, trailer_url text, trailer_site text,
  trailer_id text, next_episode_date timestamp with time zone,
  next_episode_number integer, last_sync_check timestamp with time zone,
  genres jsonb, studios jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    t.id, t.anilist_id, t.title, t.title_english, t.title_japanese,
    t.synopsis, t.image_url, t.score, t.anilist_score, t.rank,
    t.popularity, t.year, t.color_theme, t.created_at, t.updated_at,
    -- Anime details
    ad.episodes, ad.aired_from, ad.aired_to, ad.season, ad.status, ad.type,
    ad.trailer_url, ad.trailer_site, ad.trailer_id, ad.next_episode_date,
    ad.next_episode_number, ad.last_sync_check,
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
  WHERE t.score IS NOT NULL AND t.popularity IS NOT NULL
  GROUP BY t.id, ad.title_id, ad.episodes, ad.aired_from, ad.aired_to,
           ad.season, ad.status, ad.type, ad.trailer_url, ad.trailer_site,
           ad.trailer_id, ad.next_episode_date, ad.next_episode_number, ad.last_sync_check
  ORDER BY (t.score * 0.7 + (t.popularity / 10000.0) * 0.3) DESC NULLS LAST
  LIMIT limit_param;
$function$;

-- Get trending manga (high score + popularity)
CREATE OR REPLACE FUNCTION public.get_trending_manga(limit_param integer DEFAULT 20)
RETURNS TABLE(
  id uuid, anilist_id integer, title text, title_english text, title_japanese text,
  synopsis text, image_url text, score numeric, anilist_score numeric, rank integer,
  popularity integer, year integer, color_theme text, created_at timestamp with time zone,
  updated_at timestamp with time zone, chapters integer, volumes integer,
  published_from date, published_to date, status text, type text,
  next_chapter_date timestamp with time zone, next_chapter_number integer,
  last_sync_check timestamp with time zone, genres jsonb, authors jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    t.id, t.anilist_id, t.title, t.title_english, t.title_japanese,
    t.synopsis, t.image_url, t.score, t.anilist_score, t.rank,
    t.popularity, t.year, t.color_theme, t.created_at, t.updated_at,
    -- Manga details
    md.chapters, md.volumes, md.published_from, md.published_to,
    md.status, md.type, md.next_chapter_date, md.next_chapter_number,
    md.last_sync_check,
    -- Aggregated genres
    COALESCE(
      json_agg(DISTINCT g.*) FILTER (WHERE g.id IS NOT NULL),
      '[]'::json
    )::jsonb as genres,
    -- Aggregated authors
    COALESCE(
      json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL),
      '[]'::json
    )::jsonb as authors
  FROM titles t
  INNER JOIN manga_details md ON t.id = md.title_id
  LEFT JOIN title_genres tg ON t.id = tg.title_id
  LEFT JOIN genres g ON tg.genre_id = g.id AND g.type IN ('manga', 'both')
  LEFT JOIN title_authors ta ON t.id = ta.title_id
  LEFT JOIN authors a ON ta.author_id = a.id
  WHERE t.score IS NOT NULL AND t.popularity IS NOT NULL
  GROUP BY t.id, md.title_id, md.chapters, md.volumes, md.published_from,
           md.published_to, md.status, md.type, md.next_chapter_date,
           md.next_chapter_number, md.last_sync_check
  ORDER BY (t.score * 0.7 + (t.popularity / 10000.0) * 0.3) DESC NULLS LAST
  LIMIT limit_param;
$function$;

-- Get recent anime (newest additions or recently aired)
CREATE OR REPLACE FUNCTION public.get_recent_anime(limit_param integer DEFAULT 20)
RETURNS TABLE(
  id uuid, anilist_id integer, title text, title_english text, title_japanese text,
  synopsis text, image_url text, score numeric, anilist_score numeric, rank integer,
  popularity integer, year integer, color_theme text, created_at timestamp with time zone,
  updated_at timestamp with time zone, episodes integer, aired_from date, aired_to date,
  season text, status text, type text, trailer_url text, trailer_site text,
  trailer_id text, next_episode_date timestamp with time zone,
  next_episode_number integer, last_sync_check timestamp with time zone,
  genres jsonb, studios jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    t.id, t.anilist_id, t.title, t.title_english, t.title_japanese,
    t.synopsis, t.image_url, t.score, t.anilist_score, t.rank,
    t.popularity, t.year, t.color_theme, t.created_at, t.updated_at,
    -- Anime details
    ad.episodes, ad.aired_from, ad.aired_to, ad.season, ad.status, ad.type,
    ad.trailer_url, ad.trailer_site, ad.trailer_id, ad.next_episode_date,
    ad.next_episode_number, ad.last_sync_check,
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
  GROUP BY t.id, ad.title_id, ad.episodes, ad.aired_from, ad.aired_to,
           ad.season, ad.status, ad.type, ad.trailer_url, ad.trailer_site,
           ad.trailer_id, ad.next_episode_date, ad.next_episode_number, ad.last_sync_check
  ORDER BY COALESCE(ad.aired_from, t.created_at) DESC NULLS LAST
  LIMIT limit_param;
$function$;

-- Get recent manga (newest additions or recently published)
CREATE OR REPLACE FUNCTION public.get_recent_manga(limit_param integer DEFAULT 20)
RETURNS TABLE(
  id uuid, anilist_id integer, title text, title_english text, title_japanese text,
  synopsis text, image_url text, score numeric, anilist_score numeric, rank integer,
  popularity integer, year integer, color_theme text, created_at timestamp with time zone,
  updated_at timestamp with time zone, chapters integer, volumes integer,
  published_from date, published_to date, status text, type text,
  next_chapter_date timestamp with time zone, next_chapter_number integer,
  last_sync_check timestamp with time zone, genres jsonb, authors jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    t.id, t.anilist_id, t.title, t.title_english, t.title_japanese,
    t.synopsis, t.image_url, t.score, t.anilist_score, t.rank,
    t.popularity, t.year, t.color_theme, t.created_at, t.updated_at,
    -- Manga details
    md.chapters, md.volumes, md.published_from, md.published_to,
    md.status, md.type, md.next_chapter_date, md.next_chapter_number,
    md.last_sync_check,
    -- Aggregated genres
    COALESCE(
      json_agg(DISTINCT g.*) FILTER (WHERE g.id IS NOT NULL),
      '[]'::json
    )::jsonb as genres,
    -- Aggregated authors
    COALESCE(
      json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL),
      '[]'::json
    )::jsonb as authors
  FROM titles t
  INNER JOIN manga_details md ON t.id = md.title_id
  LEFT JOIN title_genres tg ON t.id = tg.title_id
  LEFT JOIN genres g ON tg.genre_id = g.id AND g.type IN ('manga', 'both')
  LEFT JOIN title_authors ta ON t.id = ta.title_id
  LEFT JOIN authors a ON ta.author_id = a.id
  GROUP BY t.id, md.title_id, md.chapters, md.volumes, md.published_from,
           md.published_to, md.status, md.type, md.next_chapter_date,
           md.next_chapter_number, md.last_sync_check
  ORDER BY COALESCE(md.published_from, t.created_at) DESC NULLS LAST
  LIMIT limit_param;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_trending_anime(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_manga(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_anime(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_manga(integer) TO anon, authenticated;