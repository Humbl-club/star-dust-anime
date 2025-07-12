-- Phase 5: Populate Status Reference Data
INSERT INTO list_statuses (name, label, media_type, sort_order) VALUES
-- Anime statuses
('watching', 'Watching', 'anime', 1),
('completed', 'Completed', 'both', 2),
('on_hold', 'On Hold', 'anime', 3),
('dropped', 'Dropped', 'anime', 4),
('plan_to_watch', 'Plan to Watch', 'anime', 5),
-- Manga statuses  
('reading', 'Reading', 'manga', 1),
('on_hold_manga', 'On Hold', 'manga', 3),
('dropped_manga', 'Dropped', 'manga', 4),
('plan_to_read', 'Plan to Read', 'manga', 5);