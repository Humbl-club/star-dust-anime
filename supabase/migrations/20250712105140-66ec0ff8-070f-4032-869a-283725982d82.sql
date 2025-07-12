-- Phase 2: Create Unified User Lists Table with proper foreign key
CREATE TABLE user_title_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title_id uuid NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('anime', 'manga')),
  status_id uuid NOT NULL REFERENCES list_statuses(id),
  
  -- Progress tracking (preserved from both tables)
  episodes_watched integer DEFAULT 0,
  chapters_read integer DEFAULT 0,
  volumes_read integer DEFAULT 0,
  
  -- Rating and metadata (preserved exactly)
  score integer CHECK (score >= 0 AND score <= 10),
  start_date date,
  finish_date date,
  notes text,
  
  -- Timestamps (preserved exactly)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one entry per user per title
  UNIQUE(user_id, title_id, media_type)
);

-- Enable RLS
ALTER TABLE user_title_lists ENABLE ROW LEVEL SECURITY;

-- Users can only access their own lists
CREATE POLICY "Users manage own title lists" ON user_title_lists
  FOR ALL USING (auth.uid() = user_id);

-- Phase 3: Create Optimized Indexes
CREATE INDEX idx_user_title_lists_user_media ON user_title_lists(user_id, media_type);
CREATE INDEX idx_user_title_lists_status ON user_title_lists(status_id);
CREATE INDEX idx_user_title_lists_updated ON user_title_lists(updated_at DESC);
CREATE INDEX idx_user_title_lists_score ON user_title_lists(score DESC) WHERE score IS NOT NULL;
CREATE INDEX idx_user_title_lists_title ON user_title_lists(title_id);

-- Phase 4: Performance Triggers
CREATE TRIGGER update_user_title_lists_updated_at
  BEFORE UPDATE ON user_title_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();