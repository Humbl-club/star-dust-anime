-- FINAL AGGRESSIVE INDEX CLEANUP - REMOVE ALL DUPLICATE AND REDUNDANT INDEXES
-- This will address the remaining 146 performance issues

-- Drop ALL redundant indexes on user_title_lists (keep only 4 essential)
DROP INDEX IF EXISTS idx_user_lists_fast_query;
DROP INDEX IF EXISTS idx_user_lists_score_filter;
DROP INDEX IF EXISTS idx_user_lists_updated;
DROP INDEX IF EXISTS idx_user_title_lists_media_type;
DROP INDEX IF EXISTS idx_user_title_lists_progress;
DROP INDEX IF EXISTS idx_user_title_lists_score_status;
DROP INDEX IF EXISTS idx_user_title_lists_status;
DROP INDEX IF EXISTS idx_user_title_lists_status_media;
DROP INDEX IF EXISTS idx_user_title_lists_title;
DROP INDEX IF EXISTS idx_user_title_lists_title_lookup;
DROP INDEX IF EXISTS idx_user_title_lists_ultra_fast;
DROP INDEX IF EXISTS idx_user_title_lists_updated;
DROP INDEX IF EXISTS idx_user_title_lists_user_status;

-- Drop ALL redundant indexes on titles (keep only 5 essential)
DROP INDEX IF EXISTS idx_titles_anilist_fast;
DROP INDEX IF EXISTS idx_titles_anilist_id_unique;
DROP INDEX IF EXISTS idx_titles_popularity_score;
DROP INDEX IF EXISTS idx_titles_search_performance;
DROP INDEX IF EXISTS idx_titles_year_lookup;
DROP INDEX IF EXISTS idx_titles_year_score_active;

-- Drop ALL redundant indexes on anime_details (keep only 3 essential)
DROP INDEX IF EXISTS idx_anime_details_episodes_status;
DROP INDEX IF EXISTS idx_anime_details_fast_lookup;
DROP INDEX IF EXISTS idx_anime_details_popular;
DROP INDEX IF EXISTS idx_anime_details_status_type;
DROP INDEX IF EXISTS idx_anime_details_title_id;
DROP INDEX IF EXISTS idx_anime_details_title_lookup;

-- Drop ALL redundant indexes on manga_details (keep only 3 essential)
DROP INDEX IF EXISTS idx_manga_details_chapters_status;
DROP INDEX IF EXISTS idx_manga_details_fast_lookup;
DROP INDEX IF EXISTS idx_manga_details_popular;
DROP INDEX IF EXISTS idx_manga_details_status_type;
DROP INDEX IF EXISTS idx_manga_details_title_id;
DROP INDEX IF EXISTS idx_manga_details_title_lookup;

-- Drop ALL redundant indexes on junction tables (keep only 2 each)
DROP INDEX IF EXISTS idx_authors_title_fast;
DROP INDEX IF EXISTS idx_title_authors_fast;
DROP INDEX IF EXISTS idx_title_authors_lookup;
DROP INDEX IF EXISTS idx_title_authors_title_lookup;

DROP INDEX IF EXISTS idx_genres_title_fast;
DROP INDEX IF EXISTS idx_title_genres_fast;
DROP INDEX IF EXISTS idx_title_genres_lookup;
DROP INDEX IF EXISTS idx_title_genres_title_lookup;

DROP INDEX IF EXISTS idx_studios_title_fast;
DROP INDEX IF EXISTS idx_title_studios_fast;
DROP INDEX IF EXISTS idx_title_studios_lookup;
DROP INDEX IF EXISTS idx_title_studios_title_lookup;

-- Update database statistics
ANALYZE user_title_lists;
ANALYZE titles;
ANALYZE anime_details;
ANALYZE manga_details;
ANALYZE title_genres;
ANALYZE title_studios;
ANALYZE title_authors;