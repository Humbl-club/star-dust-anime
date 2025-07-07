-- First update any invalid operation types to valid ones
UPDATE content_sync_status 
SET operation_type = 'full-sync' 
WHERE operation_type NOT IN ('comprehensive-sync', 'incremental-sync', 'full-sync', 'ultra-fast-sync', 'comprehensive-normalized-sync')
   OR operation_type IS NULL;

-- Drop the existing constraint
ALTER TABLE content_sync_status 
DROP CONSTRAINT IF EXISTS content_sync_status_operation_type_check;

-- Add the correct check constraint
ALTER TABLE content_sync_status 
ADD CONSTRAINT content_sync_status_operation_type_check 
CHECK (operation_type IN ('comprehensive-sync', 'incremental-sync', 'full-sync', 'ultra-fast-sync', 'comprehensive-normalized-sync'));