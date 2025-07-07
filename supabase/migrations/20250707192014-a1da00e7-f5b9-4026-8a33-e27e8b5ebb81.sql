-- Phase 2: Clean up stale sync records
DELETE FROM content_sync_status WHERE status = 'running' AND started_at < (NOW() - INTERVAL '2 hours');

-- Reset any pending sync status that might be stuck
UPDATE content_sync_status 
SET status = 'completed', completed_at = NOW() 
WHERE status IN ('running', 'pending') AND started_at < (NOW() - INTERVAL '1 hour');