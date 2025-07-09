-- Update automated sync to run every 2 minutes with dual sync
-- Remove existing cron jobs that are using outdated functions
SELECT cron.unschedule('intelligent-content-sync-6h');
SELECT cron.unschedule('daily-incremental-sync');
SELECT cron.unschedule('weekly-anilist-enhancement');

-- Create new automated dual sync job that runs every 2 minutes
SELECT cron.schedule(
  'automated-dual-sync-2min',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT
    net.http_post(
        url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/schedule-cron-trigger',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDk0NzksImV4cCI6MjA2MzA4NTQ3OX0.ySdY2C6kZQhKKNfFVaLeLIzGEw00cJy2iJRFhxixqDo"}'::jsonb,
        body:=concat('{"trigger": "automated_dual_sync", "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);