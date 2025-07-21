-- Update RPC functions to handle multiple ID formats robustly

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_anime_detail(text);
DROP FUNCTION IF EXISTS public.get_manga_detail(text);

-- Recreate get_anime_detail with flexible ID matching
CREATE OR REPLACE FUNCTION public.get_anime_detail(anime_id_param text)
RETURNS TABLE(
  id uuid, anilist_id integer, title text, title_english text, title_japanese text, 
  synopsis text, image_url text, score numeric, anilist_score numeric, rank integer, 
  popularity integer, num_users_voted integer, year integer, color_theme text, 
  created_at timestamp with time zone, updated_at timestamp with time zone,
  episodes integer, aired_from date, aired_to date, season text, status text, 
  type text, trailer_url text, trailer_site text, trailer_id text, 
  next_episode_date timestamp with time zone, next_episode_number integer, 
  last_sync_check timestamp with time zone, genres jsonb, studios jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    COALESCE((SELECT COUNT(*)::integer FROM score_validations sv WHERE sv.title_id = t.id), 0) as num_users_voted,
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
  WHERE (
    -- UUID format check and match
    (anime_id_param ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND t.id = anime_id_param::uuid)
    OR 
    -- Integer/AniList ID match
    (anime_id_param ~ '^\d+$' AND t.anilist_id::text = anime_id_param)
    OR
    -- Fallback string match for id
    (t.id::text = anime_id_param)
  )
  GROUP BY t.id, ad.title_id, ad.episodes, ad.aired_from, ad.aired_to, 
           ad.season, ad.status, ad.type, ad.trailer_url, ad.trailer_site,
           ad.trailer_id, ad.next_episode_date, ad.next_episode_number, ad.last_sync_check;
$function$;

-- Recreate get_manga_detail with flexible ID matching
CREATE OR REPLACE FUNCTION public.get_manga_detail(manga_id_param text)
RETURNS TABLE(
  id uuid, anilist_id integer, title text, title_english text, title_japanese text, 
  synopsis text, image_url text, score numeric, anilist_score numeric, rank integer, 
  popularity integer, num_users_voted integer, year integer, color_theme text, 
  created_at timestamp with time zone, updated_at timestamp with time zone,
  chapters integer, volumes integer, published_from date, published_to date, 
  status text, type text, next_chapter_date timestamp with time zone, 
  next_chapter_number integer, last_sync_check timestamp with time zone, 
  genres jsonb, authors jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    COALESCE((SELECT COUNT(*)::integer FROM score_validations sv WHERE sv.title_id = t.id), 0) as num_users_voted,
    t.year,
    t.color_theme,
    t.created_at,
    t.updated_at,
    -- Manga details
    md.chapters,
    md.volumes,
    md.published_from,
    md.published_to,
    md.status,
    md.type,
    md.next_chapter_date,
    md.next_chapter_number,
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
  WHERE (
    -- UUID format check and match
    (manga_id_param ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' AND t.id = manga_id_param::uuid)
    OR 
    -- Integer/AniList ID match
    (manga_id_param ~ '^\d+$' AND t.anilist_id::text = manga_id_param)
    OR
    -- Fallback string match for id
    (t.id::text = manga_id_param)
  )
  GROUP BY t.id, md.title_id, md.chapters, md.volumes, md.published_from, md.published_to, 
           md.status, md.type, md.next_chapter_date, md.next_chapter_number, md.last_sync_check;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_anime_detail(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_manga_detail(text) TO anon, authenticated;