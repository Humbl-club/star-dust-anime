-- Enhanced cache invalidation system with comprehensive triggers

-- Drop existing triggers first
DROP TRIGGER IF EXISTS titles_cache_invalidation ON titles;
DROP TRIGGER IF EXISTS anime_details_cache_invalidation ON anime_details;
DROP TRIGGER IF EXISTS manga_details_cache_invalidation ON manga_details;
DROP TRIGGER IF EXISTS genres_cache_invalidation ON genres;
DROP TRIGGER IF EXISTS studios_cache_invalidation ON studios;

-- Enhanced function to notify cache invalidation with more specific patterns
CREATE OR REPLACE FUNCTION notify_enhanced_cache_invalidation()
RETURNS trigger AS $$
DECLARE
  content_type text;
  title_id_val uuid;
BEGIN
  -- Determine content type and title ID
  IF TG_TABLE_NAME = 'anime_details' THEN
    content_type := 'anime';
    title_id_val := COALESCE(NEW.title_id, OLD.title_id);
  ELSIF TG_TABLE_NAME = 'manga_details' THEN
    content_type := 'manga';
    title_id_val := COALESCE(NEW.title_id, OLD.title_id);
  ELSIF TG_TABLE_NAME = 'titles' THEN
    title_id_val := COALESCE(NEW.id, OLD.id);
    -- Determine content type by checking which details table has this title
    IF EXISTS (SELECT 1 FROM anime_details WHERE title_id = title_id_val) THEN
      content_type := 'anime';
    ELSIF EXISTS (SELECT 1 FROM manga_details WHERE title_id = title_id_val) THEN
      content_type := 'manga';
    ELSE
      content_type := 'unknown';
    END IF;
  ELSE
    content_type := 'all';
  END IF;

  -- Call edge function to invalidate multiple cache patterns
  PERFORM http_post(
    'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/cache-utils',
    jsonb_build_object(
      'action', 'invalidate_patterns',
      'patterns', jsonb_build_array(
        concat('cache:', TG_TABLE_NAME, ':*'),
        concat('cache:trending:', content_type, ':*'),
        concat('cache:popular:', content_type, ':*'),
        concat('cache:recent:', content_type, ':*'),
        concat('cache:generic:', content_type, ':*'),
        'cache:homepage:*',
        'cache:stats:*'
      ),
      'table_name', TG_TABLE_NAME,
      'content_type', content_type,
      'title_id', title_id_val
    )::text,
    'application/json'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add enhanced triggers to content tables
CREATE TRIGGER titles_enhanced_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON titles
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

CREATE TRIGGER anime_details_enhanced_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON anime_details
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

CREATE TRIGGER manga_details_enhanced_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON manga_details
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

-- Add triggers for related tables that affect cache
CREATE TRIGGER title_genres_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON title_genres
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

CREATE TRIGGER title_studios_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON title_studios
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

CREATE TRIGGER title_authors_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON title_authors
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

-- Function to manually trigger cache warming
CREATE OR REPLACE FUNCTION warm_cache_manually()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Call cache stats function to trigger warmup
  PERFORM http_post(
    'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/cache-stats',
    jsonb_build_object(
      'action', 'warmup'
    )::text,
    'application/json'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Cache warmup initiated',
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table for cache performance metrics
CREATE TABLE IF NOT EXISTS cache_performance_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type text NOT NULL, -- 'hit_ratio', 'response_time', 'key_count'
  metric_value numeric NOT NULL,
  cache_key text,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Enable RLS on cache metrics
ALTER TABLE cache_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for service role to manage cache metrics
CREATE POLICY "Service role manages cache metrics"
ON cache_performance_metrics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to log cache performance metrics
CREATE OR REPLACE FUNCTION log_cache_performance(
  metric_type_param text,
  metric_value_param numeric,
  cache_key_param text DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO cache_performance_metrics (
    metric_type,
    metric_value,
    cache_key,
    metadata
  ) VALUES (
    metric_type_param,
    metric_value_param,
    cache_key_param,
    metadata_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;