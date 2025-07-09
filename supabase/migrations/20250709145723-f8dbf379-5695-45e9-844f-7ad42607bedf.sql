-- Fix cron_job_logs status constraint to allow 'success' and 'error' values
ALTER TABLE cron_job_logs DROP CONSTRAINT IF EXISTS cron_job_logs_status_check;

-- Add updated constraint that includes 'success' and 'error'
ALTER TABLE cron_job_logs ADD CONSTRAINT cron_job_logs_status_check 
CHECK (status IN ('started', 'completed', 'failed', 'success', 'error'));