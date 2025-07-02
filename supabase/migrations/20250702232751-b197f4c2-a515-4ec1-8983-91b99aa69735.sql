-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a scheduled job to trigger sync every 6 hours
SELECT cron.schedule(
  'intelligent-content-sync-6h',
  '0 */6 * * *', -- Every 6 hours at the top of the hour
  $$
  SELECT
    net.http_post(
        url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/schedule-cron-trigger',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDk0NzksImV4cCI6MjA2MzA4NTQ3OX0.ySdY2C6kZQhKKNfFVaLeLIzGEw00cJy2iJRFhxixqDo"}'::jsonb,
        body:=concat('{"trigger": "cron", "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);