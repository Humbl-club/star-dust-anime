
-- Comprehensive Database and Edge Function Cleanup Migration
-- This migration removes unused edge functions, fixes cron jobs, and optimizes database performance

-- Phase 1: Clean up broken cron job references
-- Remove cron jobs that reference non-existent functions
SELECT cron.unschedule('intelligent-content-sync-6h') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'intelligent-content-sync-6h'
);

SELECT cron.unschedule('daily-incremental-sync') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-incremental-sync'
);

SELECT cron.unschedule('weekly-anilist-enhancement') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'weekly-anilist-enhancement'
);

-- Phase 2: Update the existing cron job to use correct function names
-- Replace the broken cron job with a working one that calls automated-dual-sync
SELECT cron.unschedule('intelligent-content-sync-6h') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'intelligent-content-sync-6h'
);

-- Update existing cron job to call the correct function
UPDATE cron.job 
SET command = $$
  SELECT
    net.http_post(
        url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/automated-dual-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDk0NzksImV4cCI6MjA2MzA4NTQ3OX0.ySdY2C6kZQhKKNfFVaLeLIzGEw00cJy2iJRFhxixqDo"}'::jsonb,
        body:=concat('{"trigger": "cron", "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
WHERE jobname = 'intelligent-content-sync-6h';

-- Phase 3: Clean up orphaned cron job logs for deleted functions
DELETE FROM public.cron_job_logs 
WHERE job_name IN (
  'incremental-sync',
  'intelligent-content-sync', 
  'complete-anilist-sync',
  'tmdb-enhancement',
  'sync-anime-dedicated',
  'sync-manga-dedicated'
);

-- Phase 4: Add performance indexes for current edge functions
-- Optimize queries that edge functions commonly perform
CREATE INDEX IF NOT EXISTS idx_titles_anilist_id_active 
ON titles (anilist_id) 
WHERE image_url IS NOT NULL AND synopsis IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sync_logs_content_operation 
ON sync_logs (content_type, operation_type, created_at DESC);

-- Phase 5: Clean up any unused stored procedures or functions
-- Remove any database functions that were created for deleted edge functions
DROP FUNCTION IF EXISTS public.incremental_sync_titles();
DROP FUNCTION IF EXISTS public.intelligent_content_sync();
DROP FUNCTION IF EXISTS public.tmdb_enhance_content();

-- Phase 6: Optimize autovacuum for tables used by remaining edge functions
ALTER TABLE titles SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE cron_job_logs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 50
);

-- Phase 7: Final cleanup - remove old sync status records for deleted functions
DELETE FROM public.content_sync_status 
WHERE operation_type IN (
  'incremental_sync',
  'intelligent_sync',
  'tmdb_enhancement'
);

-- Add comment documenting active edge functions
COMMENT ON TABLE cron_job_logs IS 'Active Edge Functions: ultra-fast-sync, automated-dual-sync, schedule-cron-trigger, send-auth-emails, ai-recommendations, ai-search, anime-api-new, check-email-exists, sync-anilist-data, sync-images';

-- Final statistics update
ANALYZE titles, sync_logs, cron_job_logs, content_sync_status;
