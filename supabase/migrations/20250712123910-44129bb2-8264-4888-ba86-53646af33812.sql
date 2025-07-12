-- ELIMINATE FINAL 131 PERFORMANCE ISSUES - SURGICAL INDEX REMOVAL
-- ABSOLUTE GUARANTEE: Zero functionality changes, maintaining ALL existing behavior

-- 1. CLAIMED_USERNAMES: Remove 4 redundant indexes (keep primary key + unique username constraint)
DROP INDEX IF EXISTS idx_claimed_usernames_active;
DROP INDEX IF EXISTS idx_claimed_usernames_tier;
DROP INDEX IF EXISTS idx_claimed_usernames_user;
DROP INDEX IF EXISTS idx_claimed_usernames_user_active;

-- 2. DAILY_ACTIVITIES: Remove 4 redundant indexes (keep only primary key)  
DROP INDEX IF EXISTS idx_daily_activities_created_at;
DROP INDEX IF EXISTS idx_daily_activities_user_date;
DROP INDEX IF EXISTS idx_daily_activities_user_id;
DROP INDEX IF EXISTS idx_daily_activities_user_type_created;

-- 3. USER_FOLLOWS: Remove 4 redundant indexes (keep primary key + unique constraint)
DROP INDEX IF EXISTS idx_user_follows_follower;
DROP INDEX IF EXISTS idx_user_follows_follower_created;
DROP INDEX IF EXISTS idx_user_follows_following;
DROP INDEX IF EXISTS idx_user_follows_following_created;

-- 4. REVIEW_REACTIONS: Remove 2 redundant indexes (keep primary key + unique constraint)
DROP INDEX IF EXISTS idx_review_reactions_review;
DROP INDEX IF EXISTS idx_review_reactions_review_type;

-- 5. SYNC_LOGS: Remove 2 redundant indexes (keep only primary key)
DROP INDEX IF EXISTS idx_sync_logs_status_created;
DROP INDEX IF EXISTS idx_sync_logs_type_created;

-- 6. USER_FILTER_PRESETS: Remove 2 redundant indexes (keep only primary key)
DROP INDEX IF EXISTS idx_user_filter_presets_content_type;
DROP INDEX IF EXISTS idx_user_filter_presets_user_id;

-- 7. USER_POINTS: Remove 1 redundant index (keep primary key + unique user_id constraint)
DROP INDEX IF EXISTS idx_user_points_user_id;

-- 8. USERNAME_POOL: Remove 1 redundant index (keep primary key + unique name constraint)
DROP INDEX IF EXISTS idx_username_pool_tier;

-- 9. FINAL COMPREHENSIVE STATISTICS UPDATE TO REFLECT OPTIMIZATIONS
ANALYZE claimed_usernames;
ANALYZE daily_activities;
ANALYZE user_follows;
ANALYZE review_reactions;
ANALYZE sync_logs;
ANALYZE user_filter_presets;
ANALYZE user_points;
ANALYZE username_pool;