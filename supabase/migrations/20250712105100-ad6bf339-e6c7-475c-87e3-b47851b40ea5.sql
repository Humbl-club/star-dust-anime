-- Phase 1: Create Normalized Status Table
CREATE TABLE list_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  media_type text NOT NULL CHECK (media_type IN ('anime', 'manga', 'both')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE list_statuses ENABLE ROW LEVEL SECURITY;

-- Public read access to status reference
CREATE POLICY "Public read list statuses" ON list_statuses
  FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role manages list statuses" ON list_statuses
  FOR ALL USING (true);