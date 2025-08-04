-- Create streaming availability cache table
CREATE TABLE IF NOT EXISTS streaming_availability_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL,
  title_name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'US',
  available BOOLEAN NOT NULL DEFAULT false,
  platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_source TEXT NOT NULL CHECK (data_source IN ('anilist', 'justwatch', 'webscrape')),
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_title_region UNIQUE (title_id, region)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_streaming_cache_title_region ON streaming_availability_cache(title_id, region);
CREATE INDEX IF NOT EXISTS idx_streaming_cache_expires ON streaming_availability_cache(expires_at);

-- Enable RLS
ALTER TABLE streaming_availability_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read streaming availability" 
ON streaming_availability_cache FOR SELECT 
USING (true);

CREATE POLICY "Service role manages streaming cache" 
ON streaming_availability_cache FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_streaming_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM streaming_availability_cache 
  WHERE expires_at < NOW();
END;
$$;

-- Create better trending views with actual schema
CREATE OR REPLACE VIEW v_trending_anime AS
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
  -- Determine airing priority
  CASE 
    WHEN ad.status = 'Currently Airing' THEN 1
    WHEN ad.status = 'Not yet aired' AND ad.aired_from <= CURRENT_DATE + INTERVAL '30 days' THEN 2
    ELSE 3
  END as airing_priority,
  -- Calculate enhanced trending score
  (
    (COALESCE(t.popularity, 0) * 0.3) +
    (COALESCE(t.anilist_score, t.score, 0) * 10 * 0.3) +
    (CASE WHEN ad.next_episode_date > NOW() THEN 20 ELSE 0 END) +
    (CASE WHEN t.year = EXTRACT(YEAR FROM NOW()) THEN 10 ELSE 0 END) +
    (CASE WHEN ad.status = 'Currently Airing' THEN 15 ELSE 0 END)
  ) as trending_score
FROM titles t
INNER JOIN anime_details ad ON t.id = ad.title_id
WHERE (ad.status IN ('Currently Airing', 'Not yet aired') 
       OR (ad.status = 'Finished Airing' AND ad.aired_to >= CURRENT_DATE - INTERVAL '30 days'))
ORDER BY airing_priority ASC, trending_score DESC;

-- Create trending manga view
CREATE OR REPLACE VIEW v_trending_manga AS
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
  -- Calculate enhanced trending score for manga
  (
    (COALESCE(t.popularity, 0) * 0.3) +
    (COALESCE(t.anilist_score, t.score, 0) * 10 * 0.3) +
    (CASE WHEN md.status = 'Publishing' THEN 20 ELSE 0 END) +
    (CASE WHEN t.year = EXTRACT(YEAR FROM NOW()) THEN 10 ELSE 0 END) +
    (CASE WHEN md.next_chapter_date > NOW() THEN 15 ELSE 0 END)
  ) as trending_score
FROM titles t
INNER JOIN manga_details md ON t.id = md.title_id
WHERE md.status IN ('Publishing', 'On Hiatus')
   OR (md.status = 'Finished' AND md.published_to >= CURRENT_DATE - INTERVAL '30 days')
ORDER BY trending_score DESC;