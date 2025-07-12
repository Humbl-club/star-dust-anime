-- Check if list_statuses table already has data and handle duplicates
INSERT INTO list_statuses (name, label, media_type, sort_order) VALUES
-- Anime statuses
('watching', 'Watching', 'anime', 1),
('on_hold', 'On Hold', 'anime', 3),
('dropped', 'Dropped', 'anime', 4),
('plan_to_watch', 'Plan to Watch', 'anime', 5),
-- Manga statuses  
('reading', 'Reading', 'manga', 1),
('on_hold_manga', 'On Hold', 'manga', 3),
('dropped_manga', 'Dropped', 'manga', 4),
('plan_to_read', 'Plan to Read', 'manga', 5)
ON CONFLICT (name) DO NOTHING;

-- Update existing completed status to work for both media types
UPDATE list_statuses SET media_type = 'both' WHERE name = 'completed';

-- Add anime-specific completed if needed
INSERT INTO list_statuses (name, label, media_type, sort_order) VALUES
('completed_anime', 'Completed', 'anime', 2)
ON CONFLICT (name) DO NOTHING;

-- Add manga-specific completed if needed  
INSERT INTO list_statuses (name, label, media_type, sort_order) VALUES
('completed_manga', 'Completed', 'manga', 2)
ON CONFLICT (name) DO NOTHING;

-- Data Migration - Migrate Anime Lists (Zero Data Loss)
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
JOIN list_statuses ls ON (
  (ls.name = ual.status AND ls.media_type IN ('anime', 'both')) OR
  (ual.status = 'completed' AND ls.name = 'completed_anime') OR
  (ual.status = 'on_hold' AND ls.name = 'on_hold' AND ls.media_type = 'anime') OR
  (ual.status = 'dropped' AND ls.name = 'dropped' AND ls.media_type = 'anime')
)
ON CONFLICT (user_id, title_id, media_type) DO NOTHING;

-- Data Migration - Migrate Manga Lists (Zero Data Loss)
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
JOIN list_statuses ls ON (
  (ls.name = uml.status AND ls.media_type IN ('manga', 'both')) OR
  (uml.status = 'completed' AND ls.name = 'completed_manga') OR
  (uml.status = 'on_hold' AND ls.name = 'on_hold_manga') OR
  (uml.status = 'dropped' AND ls.name = 'dropped_manga')
)
ON CONFLICT (user_id, title_id, media_type) DO NOTHING;