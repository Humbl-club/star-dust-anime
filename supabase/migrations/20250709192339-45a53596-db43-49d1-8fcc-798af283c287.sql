-- Clean up stuck sync records that are blocking manga sync
UPDATE content_sync_status 
SET status = 'failed', 
    error_message = 'Reset stuck running status during maintenance',
    completed_at = now()
WHERE status = 'running' AND content_type = 'manga';

-- Also clean up any stuck anime sync records
UPDATE content_sync_status 
SET status = 'failed', 
    error_message = 'Reset stuck running status during maintenance', 
    completed_at = now()
WHERE status = 'running' AND content_type = 'anime';