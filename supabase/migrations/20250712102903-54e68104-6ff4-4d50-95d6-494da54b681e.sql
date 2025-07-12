-- Phase 5: Emergency VACUUM for dead tuple elimination
VACUUM (ANALYZE, VERBOSE) profiles;
VACUUM (ANALYZE, VERBOSE) claimed_usernames;  
VACUUM (ANALYZE, VERBOSE) username_history;
VACUUM (ANALYZE, VERBOSE) user_anime_lists;
VACUUM (ANALYZE, VERBOSE) user_manga_lists;

-- Phase 6: Autovacuum optimization for high-churn tables
ALTER TABLE profiles SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 100
);

ALTER TABLE claimed_usernames SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE user_anime_lists SET (
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

ALTER TABLE user_manga_lists SET (
  autovacuum_vacuum_scale_factor = 0.2,  
  autovacuum_analyze_scale_factor = 0.1
);

-- Update statistics for query planner optimization
ANALYZE;