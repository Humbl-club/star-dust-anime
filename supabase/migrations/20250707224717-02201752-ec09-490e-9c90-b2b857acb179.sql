-- Drop the existing constraint completely first
ALTER TABLE content_sync_status 
DROP CONSTRAINT IF EXISTS content_sync_status_operation_type_check;

-- Update the data to use underscores instead of hyphens
UPDATE content_sync_status 
SET operation_type = 'full_sync' 
WHERE operation_type = 'full-sync';

-- Add the correct check constraint with underscores
ALTER TABLE content_sync_status 
ADD CONSTRAINT content_sync_status_operation_type_check 
CHECK (operation_type IN ('comprehensive_sync', 'incremental_sync', 'full_sync', 'ultra_fast_sync', 'comprehensive_normalized_sync'));