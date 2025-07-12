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
JOIN list_statuses ls ON (
  (ual.status = 'completed' AND ls.name = 'completed') OR
  (ual.status = 'watching' AND ls.name = 'watching') OR
  (ual.status = 'on_hold' AND ls.name = 'on_hold') OR
  (ual.status = 'dropped' AND ls.name = 'dropped') OR
  (ual.status = 'plan_to_watch' AND ls.name = 'plan_to_watch')
);

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
JOIN list_statuses ls ON (
  (uml.status = 'completed' AND ls.name = 'completed') OR
  (uml.status = 'reading' AND ls.name = 'reading') OR
  (uml.status = 'on_hold' AND ls.name = 'on_hold_manga') OR
  (uml.status = 'dropped' AND ls.name = 'dropped_manga') OR
  (uml.status = 'plan_to_read' AND ls.name = 'plan_to_read')
);