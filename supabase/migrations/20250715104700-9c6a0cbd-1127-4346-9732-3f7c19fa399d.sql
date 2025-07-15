-- Insert default list statuses for anime and manga
INSERT INTO public.list_statuses (name, label, media_type, sort_order, description) VALUES
-- Anime statuses
('watching', 'Watching', 'anime', 1, 'Currently watching'),
('completed', 'Completed', 'anime', 2, 'Finished watching'),
('on_hold', 'On Hold', 'anime', 3, 'Paused watching'),
('dropped', 'Dropped', 'anime', 4, 'Stopped watching'),
('plan_to_watch', 'Plan to Watch', 'anime', 5, 'Planning to watch'),

-- Manga statuses  
('reading', 'Reading', 'manga', 1, 'Currently reading'),
('completed', 'Completed', 'manga', 2, 'Finished reading'),
('on_hold', 'On Hold', 'manga', 3, 'Paused reading'),
('dropped', 'Dropped', 'manga', 4, 'Stopped reading'),
('plan_to_read', 'Plan to Read', 'manga', 5, 'Planning to read')
ON CONFLICT (name, media_type) DO NOTHING;