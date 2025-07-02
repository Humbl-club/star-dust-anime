-- Add fields for next episode/chapter tracking
ALTER TABLE anime ADD COLUMN IF NOT EXISTS next_episode_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE anime ADD COLUMN IF NOT EXISTS next_episode_number INTEGER;
ALTER TABLE anime ADD COLUMN IF NOT EXISTS airing_schedule JSONB DEFAULT '[]'::jsonb;
ALTER TABLE anime ADD COLUMN IF NOT EXISTS last_sync_check TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE manga ADD COLUMN IF NOT EXISTS next_chapter_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE manga ADD COLUMN IF NOT EXISTS next_chapter_number INTEGER;
ALTER TABLE manga ADD COLUMN IF NOT EXISTS release_schedule JSONB DEFAULT '[]'::jsonb;
ALTER TABLE manga ADD COLUMN IF NOT EXISTS last_sync_check TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create table for tracking sync operations
CREATE TABLE IF NOT EXISTS content_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'anime' or 'manga'
  operation_type TEXT NOT NULL, -- 'full_sync', 'schedule_update', 'next_episode_check'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 1,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE content_sync_status ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view sync status (public information)
CREATE POLICY "Anyone can view sync status" ON content_sync_status FOR SELECT USING (true);