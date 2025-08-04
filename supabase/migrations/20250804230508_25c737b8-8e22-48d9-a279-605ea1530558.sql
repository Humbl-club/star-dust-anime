-- Create materialized view for currently airing anime (fixed version)
CREATE MATERIALIZED VIEW mv_currently_airing AS
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
  t.favorites,
  t.year,
  t.color_theme,
  t.created_at,
  t.updated_at,
  ad.episodes,
  ad.aired_from,
  ad.aired_to,
  ad.season,
  ad.status,
  ad.type,
  ad.next_episode_date,
  ad.next_episode_number,
  -- Calculate episodes aired based on current date and weekly schedule
  CASE 
    WHEN ad.aired_from IS NOT NULL AND ad.status = 'Currently Airing' THEN
      LEAST(
        COALESCE(ad.episodes, 50), -- Default max episodes if not set
        GREATEST(1, (CURRENT_DATE - ad.aired_from) / 7 + 1)
      )
    ELSE COALESCE(ad.episodes, 0)
  END as episodes_aired,
  -- Enhanced trending score calculation
  (
    COALESCE(t.popularity, 0) * 0.4 + 
    COALESCE(t.favorites, 0) * 0.2 + 
    COALESCE(t.anilist_score, t.score, 0) * 10 * 0.3 +
    -- Recency bonus for recently aired
    CASE 
      WHEN ad.next_episode_date IS NOT NULL AND ad.next_episode_date >= CURRENT_DATE THEN 1000
      WHEN ad.aired_from IS NOT NULL AND ad.aired_from >= CURRENT_DATE - INTERVAL '30 days' THEN 500
      ELSE 0
    END
  ) as trending_score,
  -- Determine season
  CASE 
    WHEN EXTRACT(MONTH FROM COALESCE(ad.aired_from, CURRENT_DATE)) IN (12, 1, 2) THEN 'Winter'
    WHEN EXTRACT(MONTH FROM COALESCE(ad.aired_from, CURRENT_DATE)) IN (3, 4, 5) THEN 'Spring'
    WHEN EXTRACT(MONTH FROM COALESCE(ad.aired_from, CURRENT_DATE)) IN (6, 7, 8) THEN 'Summer'
    WHEN EXTRACT(MONTH FROM COALESCE(ad.aired_from, CURRENT_DATE)) IN (9, 10, 11) THEN 'Fall'
  END as calculated_season,
  -- Status indicators
  CASE 
    WHEN ad.aired_from IS NOT NULL AND ad.aired_from >= CURRENT_DATE - INTERVAL '14 days' THEN 'NEW'
    WHEN ad.aired_to IS NOT NULL AND ad.aired_to <= CURRENT_DATE + INTERVAL '14 days' AND ad.status = 'Currently Airing' THEN 'FINALE_SOON'
    ELSE NULL
  END as status_indicator
FROM titles t
JOIN anime_details ad ON t.id = ad.title_id
WHERE 
  ad.status IN ('Currently Airing', 'Not yet aired')
  OR (ad.status = 'Finished Airing' AND ad.aired_to >= CURRENT_DATE - INTERVAL '30 days')
ORDER BY trending_score DESC;

-- Create unique index on the materialized view for concurrent refresh
CREATE UNIQUE INDEX mv_currently_airing_id_idx ON mv_currently_airing (id);

-- Create materialized view for currently publishing manga
CREATE MATERIALIZED VIEW mv_currently_publishing AS
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
  t.favorites,
  t.year,
  t.color_theme,
  t.created_at,
  t.updated_at,
  md.chapters,
  md.volumes,
  md.published_from,
  md.published_to,
  md.status,
  md.type,
  md.next_chapter_date,
  md.next_chapter_number,
  -- Enhanced trending score for manga
  (
    COALESCE(t.popularity, 0) * 0.4 + 
    COALESCE(t.favorites, 0) * 0.2 + 
    COALESCE(t.anilist_score, t.score, 0) * 10 * 0.3 +
    -- Recency bonus for active publishing
    CASE 
      WHEN md.next_chapter_date IS NOT NULL AND md.next_chapter_date >= CURRENT_DATE THEN 1000
      WHEN md.published_from IS NOT NULL AND md.published_from >= CURRENT_DATE - INTERVAL '30 days' THEN 500
      ELSE 0
    END
  ) as trending_score,
  -- Status indicators for manga
  CASE 
    WHEN md.published_from IS NOT NULL AND md.published_from >= CURRENT_DATE - INTERVAL '14 days' THEN 'NEW'
    WHEN md.published_to IS NOT NULL AND md.published_to <= CURRENT_DATE + INTERVAL '14 days' AND md.status = 'Publishing' THEN 'ENDING_SOON'
    ELSE NULL
  END as status_indicator
FROM titles t
JOIN manga_details md ON t.id = md.title_id
WHERE 
  md.status = 'Publishing'
  OR (md.status = 'Finished' AND md.published_to >= CURRENT_DATE - INTERVAL '30 days')
ORDER BY trending_score DESC;

-- Create unique index on the manga materialized view
CREATE UNIQUE INDEX mv_currently_publishing_id_idx ON mv_currently_publishing (id);

-- Create function to refresh trending views
CREATE OR REPLACE FUNCTION refresh_trending_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh both materialized views concurrently
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_currently_airing;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_currently_publishing;
  
  -- Log the refresh
  INSERT INTO cron_job_logs (job_name, status, details)
  VALUES (
    'refresh_trending_views',
    'success',
    jsonb_build_object(
      'refreshed_at', now(),
      'anime_count', (SELECT COUNT(*) FROM mv_currently_airing),
      'manga_count', (SELECT COUNT(*) FROM mv_currently_publishing)
    )
  );
END;
$$;

-- Create cron job to refresh trending views daily at 6 AM UTC
SELECT cron.schedule(
  'refresh-trending-views-daily',
  '0 6 * * *',
  $$SELECT refresh_trending_views();$$
);

-- Create function to get seasonal anime
CREATE OR REPLACE FUNCTION get_seasonal_anime(
  season_name text DEFAULT NULL,
  season_year integer DEFAULT NULL,
  limit_param integer DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  anilist_id integer,
  title text,
  title_english text,
  title_japanese text,
  synopsis text,
  image_url text,
  score numeric,
  popularity integer,
  favorites integer,
  year integer,
  episodes integer,
  status text,
  type text,
  season text,
  aired_from date,
  next_episode_date timestamp with time zone,
  next_episode_number integer,
  episodes_aired integer,
  trending_score numeric,
  status_indicator text,
  genres jsonb,
  studios jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH seasonal_data AS (
    SELECT 
      mca.*,
      COALESCE(
        json_agg(DISTINCT g.*) FILTER (WHERE g.id IS NOT NULL),
        '[]'::json
      )::jsonb as genres,
      COALESCE(
        json_agg(DISTINCT s.*) FILTER (WHERE s.id IS NOT NULL),
        '[]'::json
      )::jsonb as studios
    FROM mv_currently_airing mca
    LEFT JOIN title_genres tg ON mca.id = tg.title_id
    LEFT JOIN genres g ON tg.genre_id = g.id AND g.type IN ('anime', 'both')
    LEFT JOIN title_studios ts ON mca.id = ts.title_id
    LEFT JOIN studios st ON ts.studio_id = st.id
    WHERE 
      (season_name IS NULL OR mca.calculated_season = season_name)
      AND (season_year IS NULL OR mca.year = season_year)
    GROUP BY 
      mca.id, mca.anilist_id, mca.title, mca.title_english, mca.title_japanese,
      mca.synopsis, mca.image_url, mca.score, mca.popularity, mca.favorites,
      mca.year, mca.episodes, mca.status, mca.type, mca.season, mca.aired_from,
      mca.next_episode_date, mca.next_episode_number, mca.episodes_aired,
      mca.trending_score, mca.calculated_season, mca.status_indicator
    ORDER BY mca.trending_score DESC
    LIMIT limit_param
  )
  SELECT 
    sd.id, sd.anilist_id, sd.title, sd.title_english, sd.title_japanese,
    sd.synopsis, sd.image_url, sd.score, sd.popularity, sd.favorites,
    sd.year, sd.episodes, sd.status, sd.type, sd.calculated_season as season,
    sd.aired_from, sd.next_episode_date, sd.next_episode_number,
    sd.episodes_aired, sd.trending_score, sd.status_indicator,
    sd.genres, sd.studios
  FROM seasonal_data sd;
$$;