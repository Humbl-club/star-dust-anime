-- Phase 5: Database Optimization
-- Critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_titles_content_type ON titles(content_type);
CREATE INDEX IF NOT EXISTS idx_titles_popularity ON titles(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_titles_search ON titles USING gin(to_tsvector('english', title || ' ' || COALESCE(title_english, '')));
CREATE INDEX IF NOT EXISTS idx_anime_details_status ON anime_details(status);
CREATE INDEX IF NOT EXISTS idx_manga_details_status ON manga_details(status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_titles_content_type_score ON titles(content_type, anilist_score DESC);
CREATE INDEX IF NOT EXISTS idx_titles_content_type_year ON titles(content_type, year DESC);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_titles_year ON titles(year DESC);
CREATE INDEX IF NOT EXISTS idx_titles_score ON titles(anilist_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_title_genres_title_id ON title_genres(title_id);
CREATE INDEX IF NOT EXISTS idx_title_genres_genre_id ON title_genres(genre_id);

-- Trending content materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trending_content AS
SELECT 
  t.id,
  t.anilist_id,
  t.title,
  t.title_english,
  t.title_japanese,
  t.synopsis,
  t.image_url,
  t.anilist_score,
  t.rank,
  t.popularity,
  t.year,
  t.color_theme,
  t.created_at,
  t.updated_at,
  t.content_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM anime_details WHERE title_id = t.id) THEN 'anime'
    WHEN EXISTS (SELECT 1 FROM manga_details WHERE title_id = t.id) THEN 'manga'
    ELSE t.content_type
  END as verified_content_type,
  CASE 
    WHEN ad.episodes IS NOT NULL THEN ad.episodes
    WHEN md.chapters IS NOT NULL THEN md.chapters
    ELSE 0
  END as progress_count,
  COALESCE(ad.status, md.status, 'Unknown') as status,
  array_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
  COUNT(DISTINCT utl.id) as list_count,
  -- Trending score calculation
  (
    COALESCE(t.anilist_score, 0) * 0.4 + 
    COALESCE(t.popularity, 0) / 1000.0 * 0.3 + 
    COUNT(DISTINCT utl.id) * 0.3
  ) as trending_score
FROM titles t
LEFT JOIN anime_details ad ON t.id = ad.title_id
LEFT JOIN manga_details md ON t.id = md.title_id
LEFT JOIN title_genres tg ON t.id = tg.title_id
LEFT JOIN genres g ON tg.genre_id = g.id
LEFT JOIN user_title_lists utl ON t.id = utl.title_id
WHERE t.updated_at > NOW() - INTERVAL '90 days'
  AND (t.anilist_score > 0 OR t.popularity > 0)
GROUP BY t.id, t.anilist_id, t.title, t.title_english, t.title_japanese, 
         t.synopsis, t.image_url, t.anilist_score, t.rank, t.popularity, 
         t.year, t.color_theme, t.created_at, t.updated_at, t.content_type,
         ad.episodes, ad.status, md.chapters, md.status
ORDER BY trending_score DESC
LIMIT 1000;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_trending_content_type ON mv_trending_content(verified_content_type);
CREATE INDEX IF NOT EXISTS idx_mv_trending_content_score ON mv_trending_content(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_mv_trending_content_status ON mv_trending_content(status);

-- User statistics materialized view  
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_statistics AS
SELECT 
  p.id as user_id,
  p.full_name,
  COUNT(DISTINCT CASE WHEN utl.media_type = 'anime' THEN utl.id END) as anime_count,
  COUNT(DISTINCT CASE WHEN utl.media_type = 'manga' THEN utl.id END) as manga_count,
  COUNT(DISTINCT utl.id) as total_entries,
  AVG(CASE WHEN utl.score > 0 THEN utl.score END) as mean_score,
  COUNT(DISTINCT CASE WHEN utl.score > 0 THEN utl.id END) as scored_entries,
  MAX(utl.updated_at) as last_activity
FROM profiles p
LEFT JOIN user_title_lists utl ON p.id = utl.user_id
GROUP BY p.id, p.full_name;

-- Create indexes on user statistics view
CREATE INDEX IF NOT EXISTS idx_mv_user_stats_user_id ON mv_user_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_mv_user_stats_activity ON mv_user_statistics(last_activity DESC);

-- Function to refresh materialized views safely
CREATE OR REPLACE FUNCTION public.refresh_trending_content()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_content;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_statistics;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    INSERT INTO error_logs (error_message) 
    VALUES ('Failed to refresh materialized views: ' || SQLERRM);
END;
$$;