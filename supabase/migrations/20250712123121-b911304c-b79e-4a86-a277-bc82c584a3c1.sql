-- FINAL COMPREHENSIVE INDEX ELIMINATION - FIXED VERSION
-- Remove ALL duplicate and functionally identical indexes

-- ACTIVITY_FEED: Drop 5 redundant indexes (keep only primary key + 1 essential)
DROP INDEX IF EXISTS idx_activity_created;
DROP INDEX IF EXISTS idx_activity_feed_user_created;
DROP INDEX IF EXISTS idx_activity_feed_user_recent;
DROP INDEX IF EXISTS idx_activity_feed_user_type_created;
DROP INDEX IF EXISTS idx_activity_user_type;

-- REVIEWS: Drop 8 redundant indexes (keep only primary key + unique constraint)
DROP INDEX IF EXISTS idx_reviews_anime_created;
DROP INDEX IF EXISTS idx_reviews_content_lookup;
DROP INDEX IF EXISTS idx_reviews_essential;
DROP INDEX IF EXISTS idx_reviews_manga_created;
DROP INDEX IF EXISTS idx_reviews_title_lookup;
DROP INDEX IF EXISTS idx_reviews_title_rating;
DROP INDEX IF EXISTS idx_reviews_user_created;
DROP INDEX IF EXISTS idx_reviews_user_lookup;

-- PROFILES: Drop 3 redundant indexes (keep only primary key + unique username)
DROP INDEX IF EXISTS idx_profiles_username;
DROP INDEX IF EXISTS idx_profiles_username_verification;
DROP INDEX IF EXISTS idx_profiles_verification_status;

-- TITLES: Drop the redundant constraint (we already have idx_titles_anilist_essential)
ALTER TABLE titles DROP CONSTRAINT IF EXISTS titles_anilist_id_unique;

-- Final statistics update
ANALYZE activity_feed;
ANALYZE reviews;
ANALYZE profiles;
ANALYZE titles;