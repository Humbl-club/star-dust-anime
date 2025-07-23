-- Create partitioned archive table with correct structure matching cron_job_logs
CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive (
  id UUID DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'success', 'error')),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  details JSONB,
  error_message TEXT,
  PRIMARY KEY (id, executed_at)
) PARTITION BY RANGE (executed_at);

-- Create monthly partitions for the current and next few months
CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_01 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_02 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_03 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_04 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_05 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_06 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_07 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_08 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_09 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_10 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_11 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2024_12 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS public.cron_job_logs_archive_2025_01 
PARTITION OF public.cron_job_logs_archive 
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Enable RLS on archive table
ALTER TABLE public.cron_job_logs_archive ENABLE ROW LEVEL SECURITY;

-- Create policy restricted to service role only
CREATE POLICY "Service role can manage archived cron logs" 
ON public.cron_job_logs_archive 
FOR ALL 
TO service_role
USING (true);

-- Create function to archive old logs (30+ days old)
CREATE OR REPLACE FUNCTION public.archive_old_cron_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_count integer;
BEGIN
  -- Move logs older than 30 days to archive
  WITH archived AS (
    DELETE FROM public.cron_job_logs
    WHERE executed_at < NOW() - INTERVAL '30 days'
    RETURNING *
  )
  INSERT INTO public.cron_job_logs_archive (
    id, job_name, status, executed_at, details, error_message
  )
  SELECT 
    id, job_name, status, executed_at, details, error_message
  FROM archived;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Log the archival operation
  INSERT INTO public.cron_job_logs (job_name, status, details)
  VALUES (
    'cron_logs_archival',
    'completed',
    jsonb_build_object(
      'archived_count', archived_count,
      'archive_date', NOW(),
      'cutoff_date', NOW() - INTERVAL '30 days'
    )
  );
  
  RETURN archived_count;
END;
$$;

-- Create function to clean up very old archives (1+ year old)
CREATE OR REPLACE FUNCTION public.cleanup_old_archives()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete archived logs older than 1 year
  DELETE FROM public.cron_job_logs_archive
  WHERE executed_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  INSERT INTO public.cron_job_logs (job_name, status, details)
  VALUES (
    'archive_cleanup',
    'completed',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'cleanup_date', NOW(),
      'cutoff_date', NOW() - INTERVAL '1 year'
    )
  );
  
  RETURN deleted_count;
END;
$$;

-- Create function to automatically create new monthly partitions
CREATE OR REPLACE FUNCTION public.create_monthly_partition()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
  next_month_date DATE;
BEGIN
  -- Get the first day of next month
  partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month')::DATE;
  next_month_date := partition_date + INTERVAL '1 month';
  
  -- Create partition name
  partition_name := 'cron_job_logs_archive_' || TO_CHAR(partition_date, 'YYYY_MM');
  
  -- Create the partition if it doesn't exist
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS public.%I 
    PARTITION OF public.cron_job_logs_archive 
    FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    partition_date,
    next_month_date
  );
  
  -- Log the partition creation
  INSERT INTO public.cron_job_logs (job_name, status, details)
  VALUES (
    'partition_creation',
    'completed',
    jsonb_build_object(
      'partition_name', partition_name,
      'partition_date', partition_date,
      'created_at', NOW()
    )
  );
END;
$$;

-- Create function to get archive statistics
CREATE OR REPLACE FUNCTION public.get_archive_stats()
RETURNS TABLE (
  total_archived bigint,
  oldest_log timestamp with time zone,
  newest_log timestamp with time zone,
  jobs_by_status jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_archived,
    MIN(executed_at) as oldest_log,
    MAX(executed_at) as newest_log,
    jsonb_object_agg(status, count) as jobs_by_status
  FROM (
    SELECT status, COUNT(*)::bigint as count
    FROM public.cron_job_logs_archive
    GROUP BY status
  ) status_counts;
END;
$$;

-- Create indexes on archive table for efficient queries
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_archive_job_executed 
ON public.cron_job_logs_archive (job_name, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_cron_job_logs_archive_status 
ON public.cron_job_logs_archive (status, executed_at DESC);

-- Schedule automatic archival every week (Sundays at 3 AM UTC)
SELECT cron.schedule(
  'archive-old-cron-logs',
  '0 3 * * 0',
  $$SELECT public.archive_old_cron_logs();$$
);

-- Schedule cleanup of very old archives monthly (1st of month at 4 AM UTC)
SELECT cron.schedule(
  'cleanup-old-archives',
  '0 4 1 * *',
  $$SELECT public.cleanup_old_archives();$$
);

-- Schedule monthly partition creation (1st of month at 2 AM UTC)
SELECT cron.schedule(
  'create-monthly-partition',
  '0 2 1 * *',
  $$SELECT public.create_monthly_partition();$$
);

-- Run initial archival
SELECT public.archive_old_cron_logs();

-- Create initial partition for next month
SELECT public.create_monthly_partition();

-- Add comments documenting the archival strategy
COMMENT ON TABLE public.cron_job_logs_archive IS 'Partitioned archive of cron job logs older than 30 days. Automatically populated weekly, cleaned yearly, with monthly partitions.';
COMMENT ON FUNCTION public.archive_old_cron_logs() IS 'Archives cron logs older than 30 days to reduce main table size';
COMMENT ON FUNCTION public.cleanup_old_archives() IS 'Deletes archived logs older than 1 year to manage storage';
COMMENT ON FUNCTION public.create_monthly_partition() IS 'Automatically creates new monthly partitions for the archive table';