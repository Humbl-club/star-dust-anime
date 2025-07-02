-- Create storage buckets for anime and manga images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('anime-images', 'anime-images', true),
  ('manga-images', 'manga-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for anime images
CREATE POLICY "Anyone can view anime images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'anime-images');

CREATE POLICY "Service role can upload anime images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'anime-images');

CREATE POLICY "Service role can update anime images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'anime-images');

-- Create storage policies for manga images
CREATE POLICY "Anyone can view manga images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'manga-images');

CREATE POLICY "Service role can upload manga images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'manga-images');

CREATE POLICY "Service role can update manga images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'manga-images');

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create sync log table to track data fetching
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('anime', 'manga')),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('fetch_data', 'sync_images')),
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed')),
  items_processed INTEGER DEFAULT 0,
  page INTEGER DEFAULT 1,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for sync_logs (service role access only)
CREATE POLICY "Service role can manage sync logs" 
ON public.sync_logs 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_sync_logs_content_type ON public.sync_logs(content_type);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status);
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at DESC);