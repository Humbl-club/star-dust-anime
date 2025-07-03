-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily incremental sync at 2 AM UTC
SELECT cron.schedule(
  'daily-incremental-sync',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/incremental-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDk0NzksImV4cCI6MjA2MzA4NTQ3OX0.ySdY2C6kZQhKKNfFVaLeLIzGEw00cJy2iJRFhxixqDo"}'::jsonb,
        body:='{"daysBack": 7}'::jsonb
    ) as request_id;
  $$
);

-- Schedule weekly complete AniList enhancement on Sundays at 3 AM UTC
SELECT cron.schedule(
  'weekly-anilist-enhancement',
  '0 3 * * 0', -- Every Sunday at 3 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/sync-anilist-data',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDk0NzksImV4cCI6MjA2MzA4NTQ3OX0.ySdY2C6kZQhKKNfFVaLeLIzGEw00cJy2iJRFhxixqDo"}'::jsonb,
        body:='{"batchSize": 100, "offset": 0}'::jsonb
    ) as request_id;
  $$
);

-- Create a table to track cron job execution status
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  details JSONB,
  error_message TEXT
);

-- Enable RLS for cron logs
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage cron logs
CREATE POLICY "Service role can manage cron logs" 
ON public.cron_job_logs 
FOR ALL 
USING (true);