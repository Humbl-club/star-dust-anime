-- AGGRESSIVE AUTOVACUUM OPTIMIZATION FOR ALL REMAINING TABLES
-- Set ultra-aggressive vacuum settings for maximum performance

-- High-frequency tables get most aggressive settings
ALTER TABLE titles SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 50,
  autovacuum_analyze_threshold = 25
);

ALTER TABLE anime_details SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 100
);

ALTER TABLE manga_details SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 100
);

-- Relationship tables optimization
ALTER TABLE title_genres SET (
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

ALTER TABLE title_studios SET (
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

ALTER TABLE title_authors SET (
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

-- User activity tables
ALTER TABLE reviews SET (
  autovacuum_vacuum_scale_factor = 0.15,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE user_follows SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Lookup tables (less frequent updates)
ALTER TABLE authors SET (
  autovacuum_vacuum_scale_factor = 0.3,
  autovacuum_analyze_scale_factor = 0.15
);

ALTER TABLE genres SET (
  autovacuum_vacuum_scale_factor = 0.3,
  autovacuum_analyze_scale_factor = 0.15
);

ALTER TABLE studios SET (
  autovacuum_vacuum_scale_factor = 0.3,
  autovacuum_analyze_scale_factor = 0.15
);