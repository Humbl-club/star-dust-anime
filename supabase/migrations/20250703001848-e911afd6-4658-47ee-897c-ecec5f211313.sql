-- Add unique constraint on anilist_id for manga upserts to work
ALTER TABLE manga ADD CONSTRAINT manga_anilist_id_unique UNIQUE (anilist_id);