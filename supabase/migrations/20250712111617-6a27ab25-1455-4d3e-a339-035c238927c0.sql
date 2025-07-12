-- Drop the old user_anime_lists and user_manga_lists tables
-- All data has been migrated to user_title_lists

-- First drop foreign key constraints
ALTER TABLE user_anime_lists DROP CONSTRAINT IF EXISTS fk_user_anime_lists_title_id;
ALTER TABLE user_manga_lists DROP CONSTRAINT IF EXISTS fk_user_manga_lists_title_id;

-- Drop the old tables
DROP TABLE IF EXISTS user_anime_lists;
DROP TABLE IF EXISTS user_manga_lists;