-- Function to notify edge function about data changes
CREATE OR REPLACE FUNCTION notify_cache_invalidation()
RETURNS trigger AS $$
BEGIN
  -- Call edge function to invalidate cache
  PERFORM http_post(
    'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/cache-utils',
    jsonb_build_object(
      'action', 'invalidate',
      'pattern', concat('cache:', TG_TABLE_NAME, ':*')
    )::text,
    'application/json'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to content tables
CREATE TRIGGER titles_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON titles
FOR EACH STATEMENT EXECUTE FUNCTION notify_cache_invalidation();

CREATE TRIGGER anime_details_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON anime_details
FOR EACH STATEMENT EXECUTE FUNCTION notify_cache_invalidation();

CREATE TRIGGER manga_details_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON manga_details
FOR EACH STATEMENT EXECUTE FUNCTION notify_cache_invalidation();

-- Also invalidate cache when genres or studios change
CREATE TRIGGER genres_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON genres
FOR EACH STATEMENT EXECUTE FUNCTION notify_cache_invalidation();

CREATE TRIGGER studios_cache_invalidation
AFTER INSERT OR UPDATE OR DELETE ON studios
FOR EACH STATEMENT EXECUTE FUNCTION notify_cache_invalidation();