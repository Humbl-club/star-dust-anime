-- Phase 1: Remove Social System & Marketplace Database Tables
-- This migration removes all social and trading related tables and their dependencies

-- Drop tables in correct order to avoid foreign key conflicts
DROP TABLE IF EXISTS character_showcase_likes CASCADE;
DROP TABLE IF EXISTS character_showcases CASCADE;
DROP TABLE IF EXISTS character_trade_listings CASCADE;
DROP TABLE IF EXISTS character_enhancements CASCADE;
DROP TABLE IF EXISTS character_interactions CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;

-- Clean up any orphaned indexes that might remain
DROP INDEX IF EXISTS idx_character_showcases_public_featured;
DROP INDEX IF EXISTS idx_character_showcases_user;
DROP INDEX IF EXISTS idx_character_trade_listings_active;
DROP INDEX IF EXISTS idx_character_interactions_character1;
DROP INDEX IF EXISTS idx_user_achievements_user;

-- Remove any remaining triggers related to social features
DROP TRIGGER IF EXISTS update_character_showcases_updated_at ON character_showcases;
DROP TRIGGER IF EXISTS update_character_trade_listings_updated_at ON character_trade_listings;

-- Verify cleanup by checking remaining tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%character_%' 
AND table_name NOT IN ('character_templates', 'character_variations', 'generated_characters');

-- Log cleanup completion
INSERT INTO cleanup_audit_log (operation_phase, table_name, action, details)
VALUES (
  'social_system_removal',
  'multiple_tables',
  'social_cleanup_complete',
  jsonb_build_object(
    'removed_tables', ARRAY['character_showcases', 'character_showcase_likes', 'character_trade_listings', 'character_enhancements', 'character_interactions', 'user_achievements'],
    'status', 'SUCCESS',
    'phase', 'Phase 1: Social System Removal'
  )
);