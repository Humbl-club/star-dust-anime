-- Clear existing manga data from MAL to replace with AniList data
DELETE FROM manga WHERE mal_id IS NOT NULL;

-- Reset the manga table to prepare for AniList sync
ALTER TABLE manga ALTER COLUMN mal_id DROP NOT NULL;