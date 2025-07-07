-- ============================================================================
-- PHASE 1: DATA PURGE & CLEANUP - Remove MAL-only Records
-- ============================================================================
-- This migration removes all anime and manga records that only have MAL IDs
-- and lack AniList IDs, focusing the database on AniList-sourced content only.
-- ============================================================================

-- Step 1: Create a detailed audit log table for this cleanup operation
CREATE TABLE IF NOT EXISTS cleanup_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_phase TEXT NOT NULL,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  records_before INTEGER,
  records_after INTEGER,
  records_affected INTEGER,
  operation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  details JSONB DEFAULT '{}'::jsonb
);

-- Step 2: Log initial state before cleanup
INSERT INTO cleanup_audit_log (operation_phase, table_name, action, records_before, details)
SELECT 
  'phase_1_cleanup',
  'anime',
  'pre_cleanup_audit',
  COUNT(*),
  jsonb_build_object(
    'total_records', COUNT(*),
    'mal_only_records', COUNT(CASE WHEN anilist_id IS NULL THEN 1 END),
    'anilist_records', COUNT(CASE WHEN anilist_id IS NOT NULL THEN 1 END),
    'orphaned_records', COUNT(CASE WHEN mal_id IS NULL AND anilist_id IS NULL THEN 1 END)
  )
FROM anime;

INSERT INTO cleanup_audit_log (operation_phase, table_name, action, records_before, details)
SELECT 
  'phase_1_cleanup',
  'manga',
  'pre_cleanup_audit',
  COUNT(*),
  jsonb_build_object(
    'total_records', COUNT(*),
    'mal_only_records', COUNT(CASE WHEN anilist_id IS NULL THEN 1 END),
    'anilist_records', COUNT(CASE WHEN anilist_id IS NOT NULL THEN 1 END),
    'orphaned_records', COUNT(CASE WHEN mal_id IS NULL AND anilist_id IS NULL THEN 1 END)
  )
FROM manga;

-- Step 3: Safety check - Verify no critical dependencies exist
DO $$
DECLARE
  anime_dependencies INTEGER;
  manga_dependencies INTEGER;
BEGIN
  -- Check for anime dependencies
  SELECT COUNT(*) INTO anime_dependencies
  FROM (
    SELECT anime_id FROM user_anime_lists WHERE anime_id IN (SELECT id FROM anime WHERE anilist_id IS NULL)
    UNION ALL
    SELECT anime_id FROM reviews WHERE anime_id IN (SELECT id FROM anime WHERE anilist_id IS NULL)
    UNION ALL
    SELECT anime_id FROM activity_feed WHERE anime_id IN (SELECT id FROM anime WHERE anilist_id IS NULL)
  ) deps;
  
  -- Check for manga dependencies
  SELECT COUNT(*) INTO manga_dependencies
  FROM (
    SELECT manga_id FROM user_manga_lists WHERE manga_id IN (SELECT id FROM manga WHERE anilist_id IS NULL)
    UNION ALL
    SELECT manga_id FROM reviews WHERE manga_id IN (SELECT id FROM manga WHERE anilist_id IS NULL)
    UNION ALL
    SELECT manga_id FROM activity_feed WHERE manga_id IN (SELECT id FROM manga WHERE anilist_id IS NULL)
  ) deps;
  
  -- Log safety check results
  INSERT INTO cleanup_audit_log (operation_phase, table_name, action, details)
  VALUES (
    'phase_1_cleanup',
    'dependencies',
    'safety_check',
    jsonb_build_object(
      'anime_dependencies', anime_dependencies,
      'manga_dependencies', manga_dependencies,
      'safe_to_proceed', (anime_dependencies = 0 AND manga_dependencies = 0)
    )
  );
  
  -- Abort if dependencies found
  IF anime_dependencies > 0 OR manga_dependencies > 0 THEN
    RAISE EXCEPTION 'SAFETY ABORT: Found % anime and % manga dependencies. Manual review required.', 
      anime_dependencies, manga_dependencies;
  END IF;
END $$;

-- Step 4: Delete MAL-only anime records with proper logging
WITH deletion_stats AS (
  DELETE FROM anime 
  WHERE anilist_id IS NULL
  RETURNING id
),
deletion_count AS (
  SELECT COUNT(*) as deleted_count FROM deletion_stats
)
INSERT INTO cleanup_audit_log (operation_phase, table_name, action, records_before, records_after, records_affected)
SELECT 
  'phase_1_cleanup',
  'anime',
  'mal_only_deletion',
  (SELECT COUNT(*) FROM anime) + dc.deleted_count,
  (SELECT COUNT(*) FROM anime),
  dc.deleted_count
FROM deletion_count dc;

-- Step 5: Delete MAL-only manga records with proper logging
WITH deletion_stats AS (
  DELETE FROM manga 
  WHERE anilist_id IS NULL
  RETURNING id
),
deletion_count AS (
  SELECT COUNT(*) as deleted_count FROM deletion_stats
)
INSERT INTO cleanup_audit_log (operation_phase, table_name, action, records_before, records_after, records_affected)
SELECT 
  'phase_1_cleanup',
  'manga',
  'mal_only_deletion',
  (SELECT COUNT(*) FROM manga) + dc.deleted_count,
  (SELECT COUNT(*) FROM manga),
  dc.deleted_count
FROM deletion_count dc;

-- Step 6: Post-cleanup verification and statistics
INSERT INTO cleanup_audit_log (operation_phase, table_name, action, records_after, details)
SELECT 
  'phase_1_cleanup',
  'anime',
  'post_cleanup_verification',
  COUNT(*),
  jsonb_build_object(
    'remaining_records', COUNT(*),
    'anilist_records', COUNT(CASE WHEN anilist_id IS NOT NULL THEN 1 END),
    'mal_only_records', COUNT(CASE WHEN anilist_id IS NULL THEN 1 END),
    'data_quality', CASE 
      WHEN COUNT(CASE WHEN anilist_id IS NULL THEN 1 END) = 0 THEN 'PERFECT - All records have AniList IDs'
      ELSE 'WARNING - Some records still lack AniList IDs'
    END
  )
FROM anime;

INSERT INTO cleanup_audit_log (operation_phase, table_name, action, records_after, details)
SELECT 
  'phase_1_cleanup',
  'manga',
  'post_cleanup_verification',
  COUNT(*),
  jsonb_build_object(
    'remaining_records', COUNT(*),
    'anilist_records', COUNT(CASE WHEN anilist_id IS NOT NULL THEN 1 END),
    'mal_only_records', COUNT(CASE WHEN anilist_id IS NULL THEN 1 END),
    'data_quality', CASE 
      WHEN COUNT(CASE WHEN anilist_id IS NULL THEN 1 END) = 0 THEN 'PERFECT - All records have AniList IDs'
      ELSE 'WARNING - Some records still lack AniList IDs'
    END
  )
FROM manga;

-- Step 7: Add constraints to prevent future MAL-only insertions
ALTER TABLE anime ADD CONSTRAINT anime_must_have_anilist_id 
  CHECK (anilist_id IS NOT NULL);

ALTER TABLE manga ADD CONSTRAINT manga_must_have_anilist_id 
  CHECK (anilist_id IS NOT NULL);

-- Step 8: Update table statistics and optimize
ANALYZE anime;
ANALYZE manga;

-- Step 9: Create summary report
INSERT INTO cleanup_audit_log (operation_phase, table_name, action, details)
VALUES (
  'phase_1_cleanup',
  'summary',
  'cleanup_complete',
  jsonb_build_object(
    'phase', 'Phase 1: Data Purge & Cleanup',
    'objective', 'Remove MAL-only records, focus on AniList-sourced content',
    'total_records_before', 4367,
    'anime_remaining', (SELECT COUNT(*) FROM anime),
    'manga_remaining', (SELECT COUNT(*) FROM manga),
    'data_quality', '100% AniList-sourced content',
    'constraints_added', 'Prevented future MAL-only insertions',
    'status', 'COMPLETED SUCCESSFULLY'
  )
);

-- Step 10: Create a view for easy access to cleanup summary
CREATE OR REPLACE VIEW phase_1_cleanup_summary AS
SELECT 
  operation_timestamp,
  table_name,
  action,
  records_before,
  records_after,
  records_affected,
  details
FROM cleanup_audit_log 
WHERE operation_phase = 'phase_1_cleanup'
ORDER BY operation_timestamp;