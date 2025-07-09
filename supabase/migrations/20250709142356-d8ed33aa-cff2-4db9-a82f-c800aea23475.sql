-- Enable realtime for titles table
ALTER TABLE public.titles REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.titles;

-- Enable realtime for anime_details table  
ALTER TABLE public.anime_details REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.anime_details;

-- Enable realtime for manga_details table
ALTER TABLE public.manga_details REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.manga_details;

-- Enable realtime for cron_job_logs to track sync progress
ALTER TABLE public.cron_job_logs REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.cron_job_logs;