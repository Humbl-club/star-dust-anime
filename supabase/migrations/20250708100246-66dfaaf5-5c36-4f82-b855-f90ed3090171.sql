-- Clear old sync logs and status records (preserve all title data)
-- This only removes debugging/testing records, not actual content

-- Clear content sync status table (3,843 test records)
DELETE FROM content_sync_status;

-- Clear sync logs table (if any)
DELETE FROM sync_logs;

-- Clear cron job logs (if any)
DELETE FROM cron_job_logs;

-- Add comment for clarity
COMMENT ON TABLE content_sync_status IS 'Cleared of old testing records - only active sync status will be stored here';
COMMENT ON TABLE sync_logs IS 'Cleared of old testing records - only current sync operations will be logged here';
COMMENT ON TABLE cron_job_logs IS 'Cleared of old testing records - only current scheduled operations will be logged here';