-- Drop overly restrictive check constraints that prevent data insertion
ALTER TABLE anime DROP CONSTRAINT IF EXISTS anime_anilist_score_check;
ALTER TABLE anime DROP CONSTRAINT IF EXISTS anime_episodes_check;
ALTER TABLE anime DROP CONSTRAINT IF EXISTS anime_favorites_check;
ALTER TABLE anime DROP CONSTRAINT IF EXISTS anime_members_check;
ALTER TABLE anime DROP CONSTRAINT IF EXISTS anime_next_episode_number_check;
ALTER TABLE anime DROP CONSTRAINT IF EXISTS anime_popularity_check;
ALTER TABLE anime DROP CONSTRAINT IF EXISTS anime_rank_check;
ALTER TABLE anime DROP CONSTRAINT IF EXISTS anime_score_check;
ALTER TABLE anime DROP CONSTRAINT IF EXISTS anime_scored_by_check;

-- Add more flexible constraints that allow null values
ALTER TABLE anime ADD CONSTRAINT anime_anilist_score_check CHECK (anilist_score IS NULL OR (anilist_score >= 0 AND anilist_score <= 10));
ALTER TABLE anime ADD CONSTRAINT anime_episodes_check CHECK (episodes IS NULL OR episodes >= 0);
ALTER TABLE anime ADD CONSTRAINT anime_favorites_check CHECK (favorites IS NULL OR favorites >= 0);
ALTER TABLE anime ADD CONSTRAINT anime_members_check CHECK (members IS NULL OR members >= 0);
ALTER TABLE anime ADD CONSTRAINT anime_next_episode_number_check CHECK (next_episode_number IS NULL OR next_episode_number > 0);
ALTER TABLE anime ADD CONSTRAINT anime_popularity_check CHECK (popularity IS NULL OR popularity >= 0);
ALTER TABLE anime ADD CONSTRAINT anime_rank_check CHECK (rank IS NULL OR rank >= 0);
ALTER TABLE anime ADD CONSTRAINT anime_score_check CHECK (score IS NULL OR (score >= 0 AND score <= 10));
ALTER TABLE anime ADD CONSTRAINT anime_scored_by_check CHECK (scored_by IS NULL OR scored_by >= 0);

-- Also fix similar constraints for manga table
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_chapters_check;
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_favorites_check;
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_members_check;
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_next_chapter_number_check;
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_popularity_check;
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_rank_check;
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_score_check;
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_scored_by_check;
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_volumes_check;

-- Add flexible manga constraints
ALTER TABLE manga ADD CONSTRAINT manga_chapters_check CHECK (chapters IS NULL OR chapters >= 0);
ALTER TABLE manga ADD CONSTRAINT manga_favorites_check CHECK (favorites IS NULL OR favorites >= 0);
ALTER TABLE manga ADD CONSTRAINT manga_members_check CHECK (members IS NULL OR members >= 0);
ALTER TABLE manga ADD CONSTRAINT manga_next_chapter_number_check CHECK (next_chapter_number IS NULL OR next_chapter_number > 0);
ALTER TABLE manga ADD CONSTRAINT manga_popularity_check CHECK (popularity IS NULL OR popularity >= 0);
ALTER TABLE manga ADD CONSTRAINT manga_rank_check CHECK (rank IS NULL OR rank >= 0);
ALTER TABLE manga ADD CONSTRAINT manga_score_check CHECK (score IS NULL OR (score >= 0 AND score <= 10));
ALTER TABLE manga ADD CONSTRAINT manga_scored_by_check CHECK (scored_by IS NULL OR scored_by >= 0);
ALTER TABLE manga ADD CONSTRAINT manga_volumes_check CHECK (volumes IS NULL OR volumes >= 0);