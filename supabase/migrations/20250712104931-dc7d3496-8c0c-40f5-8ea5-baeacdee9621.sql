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

-- Phase 5: Populate Status Reference Data
INSERT INTO list_statuses (name, label, media_type, sort_order) VALUES
-- Anime statuses
('watching', 'Watching', 'anime', 1),
('completed', 'Completed', 'anime', 2),
('on_hold', 'On Hold', 'anime', 3),
('dropped', 'Dropped', 'anime', 4),
('plan_to_watch', 'Plan to Watch', 'anime', 5),
-- Manga statuses  
('reading', 'Reading', 'manga', 1),
('completed', 'Completed', 'manga', 2),
('on_hold', 'On Hold', 'manga', 3),
('dropped', 'Dropped', 'manga', 4),
('plan_to_read', 'Plan to Read', 'manga', 5);

-- Phase 6: Data Migration - Migrate Anime Lists (Zero Data Loss)
INSERT INTO user_title_lists (
  user_id, title_id, media_type, status_id, episodes_watched, 
  score, start_date, finish_date, notes, created_at, updated_at
)
SELECT 
  ual.user_id,
  ad.title_id,
  'anime',
  ls.id,
  ual.episodes_watched,
  ual.score,
  ual.start_date,
  ual.finish_date,
  ual.notes,
  ual.created_at,
  ual.updated_at
FROM user_anime_lists ual
JOIN anime_details ad ON ual.anime_detail_id = ad.id
JOIN list_statuses ls ON ls.name = ual.status AND ls.media_type = 'anime';

-- Phase 7: Data Migration - Migrate Manga Lists (Zero Data Loss)
INSERT INTO user_title_lists (
  user_id, title_id, media_type, status_id, chapters_read, volumes_read,
  score, start_date, finish_date, notes, created_at, updated_at
)
SELECT 
  uml.user_id,
  md.title_id, 
  'manga',
  ls.id,
  uml.chapters_read,
  uml.volumes_read,
  uml.score,
  uml.start_date,
  uml.finish_date,
  uml.notes,
  uml.created_at,
  uml.updated_at
FROM user_manga_lists uml
JOIN manga_details md ON uml.manga_detail_id = md.id
JOIN list_statuses ls ON ls.name = uml.status AND ls.media_type = 'manga';