-- Update cron job to use new dedicated sync functions
-- Remove old cron jobs
SELECT cron.unschedule('automated-dual-sync-2min');

-- Create new cron job with the updated trigger
SELECT cron.schedule(
  'dedicated-dual-sync-2min',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT
    net.http_post(
        url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/schedule-cron-trigger',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDk0NzksImV4cCI6MjA2MzA4NTQ3OX0.ySdY2C6kZQhKKNfFVaLeLIzGEw00cJy2iJRFhxixqDo"}'::jsonb,
        body:=concat('{"trigger": "dedicated_sync", "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);