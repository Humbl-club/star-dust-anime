-- Create materialized view for currently airing anime
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
  ad.trailer_url,
  ad.next_episode_date,
  ad.next_episode_number,
  -- Calculate trending score (using available columns)
  (COALESCE(t.popularity, 0) * 0.4 + 
   COALESCE(t.score, 0) * 30 * 0.3 + 
   COALESCE(t.anilist_score, 0) * 0.3) as trending_score,
  -- Determine current season
  CASE 
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (12, 1, 2) THEN 'Winter'
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (3, 4, 5) THEN 'Spring'
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (6, 7, 8) THEN 'Summer'
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (9, 10, 11) THEN 'Fall'
  END as current_season,
  -- Status indicators
  CASE 
    WHEN ad.aired_from >= CURRENT_DATE - INTERVAL '14 days' THEN 'NEW'
    WHEN ad.aired_to IS NOT NULL AND ad.aired_to <= CURRENT_DATE + INTERVAL '14 days' THEN 'FINALE_SOON'
    ELSE NULL
  END as status_indicator
FROM titles t
JOIN anime_details ad ON t.id = ad.title_id
WHERE ad.status = 'Currently Airing'
   OR (ad.status = 'Not yet aired' AND ad.aired_from <= CURRENT_DATE + INTERVAL '30 days')
   OR (ad.status = 'Finished Airing' AND ad.aired_to >= CURRENT_DATE - INTERVAL '30 days')
ORDER BY trending_score DESC;

-- Create unique index for concurrent refresh
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
  -- Calculate trending score
  (COALESCE(t.popularity, 0) * 0.4 + 
   COALESCE(t.score, 0) * 30 * 0.3 + 
   COALESCE(t.anilist_score, 0) * 0.3) as trending_score,
  -- Status indicators
  CASE 
    WHEN md.published_from >= CURRENT_DATE - INTERVAL '14 days' THEN 'NEW'
    WHEN md.published_to IS NOT NULL AND md.published_to <= CURRENT_DATE + INTERVAL '14 days' THEN 'ENDING_SOON'
    ELSE NULL
  END as status_indicator
FROM titles t
JOIN manga_details md ON t.id = md.title_id
WHERE md.status = 'Publishing'
   OR (md.status = 'Finished' AND md.published_to >= CURRENT_DATE - INTERVAL '30 days')
ORDER BY trending_score DESC;

-- Create unique index for concurrent refresh
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

-- Schedule daily refresh at 2 AM UTC
SELECT cron.schedule(
  'refresh-trending-views-daily',
  '0 2 * * *',
  $$SELECT refresh_trending_views();$$
);