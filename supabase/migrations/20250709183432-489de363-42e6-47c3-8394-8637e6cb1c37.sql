-- Update content_sync_status operation_type constraint to allow progressive sync types
ALTER TABLE content_sync_status DROP CONSTRAINT IF EXISTS content_sync_status_operation_type_check;

-- Add updated constraint that includes progressive sync types
ALTER TABLE content_sync_status ADD CONSTRAINT content_sync_status_operation_type_check 
CHECK (operation_type IN ('full_sync', 'schedule_update', 'next_episode_check', 'incremental_sync', 'manga_progressive_sync', 'anime_progressive_sync'));