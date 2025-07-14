
-- Create get_manga_detail function similar to get_anime_detail but for manga
CREATE OR REPLACE FUNCTION public.get_manga_detail(manga_id_param uuid)
 RETURNS TABLE(
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
   created_at timestamp with time zone, 
   updated_at timestamp with time zone,
   chapters integer, 
   volumes integer, 
   published_from date, 
   published_to date, 
   status text, 
   type text, 
   next_chapter_date timestamp with time zone, 
   next_chapter_number integer, 
   last_sync_check timestamp with time zone, 
   genres jsonb, 
   authors jsonb
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
    t.members,
    t.favorites,
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
  WHERE t.id = manga_id_param
  GROUP BY t.id, md.title_id, md.chapters, md.volumes, md.published_from, md.published_to, 
           md.status, md.type, md.next_chapter_date, md.next_chapter_number, md.last_sync_check;
$function$
