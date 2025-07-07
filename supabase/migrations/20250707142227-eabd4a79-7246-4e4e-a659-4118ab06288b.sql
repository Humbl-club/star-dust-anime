-- Phase 1: Database Cleanup
-- Drop the unnecessary views (they were a mistake)
DROP VIEW IF EXISTS anime_view;
DROP VIEW IF EXISTS manga_view;

-- Drop the old anime and manga tables (data is safely in new normalized structure)
DROP TABLE IF EXISTS anime CASCADE;
DROP TABLE IF EXISTS manga CASCADE;

-- The clean normalized schema now consists of:
-- titles (shared title data)
-- anime_details (anime-specific data)
-- manga_details (manga-specific data)
-- genres, studios, authors (reference tables)
-- title_genres, title_studios, title_authors (junction tables)