-- Fix database optimization issues

-- 1. Fix the cache invalidation trigger to use net.http_post instead of http_post
DROP TRIGGER IF EXISTS notify_enhanced_cache_invalidation_trigger ON titles;
DROP TRIGGER IF EXISTS notify_enhanced_cache_invalidation_trigger ON anime_details;
DROP TRIGGER IF EXISTS notify_enhanced_cache_invalidation_trigger ON manga_details;
DROP TRIGGER IF EXISTS notify_enhanced_cache_invalidation_trigger ON title_genres;
DROP TRIGGER IF EXISTS notify_enhanced_cache_invalidation_trigger ON title_studios;
DROP TRIGGER IF EXISTS notify_enhanced_cache_invalidation_trigger ON title_authors;

-- Update the cache invalidation function to use net.http_post
CREATE OR REPLACE FUNCTION notify_enhanced_cache_invalidation()
RETURNS TRIGGER AS $$
DECLARE
  content_type text;
  title_id_val uuid;
  service_key text;
BEGIN
  -- Get service key from settings
  SELECT current_setting('app.service_key', true) INTO service_key;
  
  -- Skip if no service key configured
  IF service_key IS NULL OR service_key = '' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

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

  -- Use net.http_post instead of http_post
  BEGIN
    PERFORM net.http_post(
      url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/cache-utils',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body:=jsonb_build_object(
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
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    INSERT INTO cron_job_logs (job_name, status, error_message)
    VALUES ('cache_invalidation_error', 'error', SQLERRM);
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Recreate triggers
CREATE TRIGGER notify_enhanced_cache_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON titles
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

CREATE TRIGGER notify_enhanced_cache_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON anime_details
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

CREATE TRIGGER notify_enhanced_cache_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON manga_details
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

CREATE TRIGGER notify_enhanced_cache_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON title_genres
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

CREATE TRIGGER notify_enhanced_cache_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON title_studios
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

CREATE TRIGGER notify_enhanced_cache_invalidation_trigger
AFTER INSERT OR UPDATE OR DELETE ON title_authors
FOR EACH ROW EXECUTE FUNCTION notify_enhanced_cache_invalidation();

-- 2. Create error logging table for materialized view refresh errors
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Service role can manage error logs
CREATE POLICY "Service role manages error logs" ON error_logs
FOR ALL USING (true);

-- 3. Create safe refresh function with error handling
CREATE OR REPLACE FUNCTION safe_refresh_materialized_views() 
RETURNS VOID AS $$
BEGIN
  -- Refresh trending content view
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_content;
    
    -- Log success
    INSERT INTO cron_job_logs (job_name, status, details)
    VALUES ('refresh_trending_content', 'success', 
            jsonb_build_object('refreshed_at', now()));
  EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO error_logs (error_message) 
    VALUES ('Failed to refresh mv_trending_content: ' || SQLERRM);
    
    INSERT INTO cron_job_logs (job_name, status, error_message)
    VALUES ('refresh_trending_content', 'error', SQLERRM);
  END;
  
  -- Refresh user statistics view
  BEGIN  
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_statistics;
    
    -- Log success
    INSERT INTO cron_job_logs (job_name, status, details)
    VALUES ('refresh_user_statistics', 'success', 
            jsonb_build_object('refreshed_at', now()));
  EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO error_logs (error_message) 
    VALUES ('Failed to refresh mv_user_statistics: ' || SQLERRM);
    
    INSERT INTO cron_job_logs (job_name, status, error_message)
    VALUES ('refresh_user_statistics', 'error', SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 4. Update cron jobs to use the safe refresh function
SELECT cron.unschedule('refresh-trending-content');
SELECT cron.unschedule('refresh-user-stats');

-- Schedule safe refresh for trending content every 5 minutes
SELECT cron.schedule(
  'safe-refresh-trending-content',
  '*/5 * * * *',
  'SELECT safe_refresh_materialized_views();'
);

-- 5. Create function to set service key (to be called manually)
CREATE OR REPLACE FUNCTION set_service_key(key_value text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.service_key', key_value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment with instructions
COMMENT ON FUNCTION set_service_key(text) IS 'Call this function with your service role key to enable cache invalidation: SELECT set_service_key(''your-service-role-key'');';