-- Set up cron jobs for email system automation
-- This enables automated health monitoring and DLQ processing

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule health monitoring every 5 minutes
SELECT cron.schedule(
  'email-health-monitor',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/email-health-monitor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUwOTQ3OSwiZXhwIjoyMDYzMDg1NDc5fQ.VaEjZzIQ1p2lQfUEVlgLUmXKwXmHYoJQlSGHnKp7zCQ"}'::jsonb,
    body := '{"scheduled": true, "timestamp": "' || now() || '"}'::jsonb
  );
  $$
);

-- Schedule DLQ processing every 10 minutes
SELECT cron.schedule(
  'dlq-processor',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/process-dlq',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUwOTQ3OSwiZXhwIjoyMDYzMDg1NDc5fQ.VaEjZzIQ1p2lQfUEVlgLUmXKwXmHYoJQlSGHnKp7zCQ"}'::jsonb,
    body := '{"scheduled": true, "timestamp": "' || now() || '"}'::jsonb
  );
  $$
);

-- Schedule cleanup of old metrics and logs (daily at 2 AM)
SELECT cron.schedule(
  'email-system-cleanup',
  '0 2 * * *',
  $$
  -- Clean up old service metrics (keep 30 days)
  DELETE FROM service_health_metrics 
  WHERE timestamp < now() - interval '30 days';
  
  -- Clean up old email delivery tracking (keep 90 days)
  DELETE FROM email_delivery_tracking 
  WHERE created_at < now() - interval '90 days';
  
  -- Clean up old rate limit tracking (keep 7 days)
  DELETE FROM rate_limit_tracking 
  WHERE created_at < now() - interval '7 days';
  
  -- Clean up old cron job logs (keep 30 days)
  DELETE FROM cron_job_logs 
  WHERE executed_at < now() - interval '30 days';
  
  -- Clean up expired email template cache
  DELETE FROM email_template_cache 
  WHERE expires_at < now();
  
  -- Clean up permanently failed DLQ items (keep 30 days)
  DELETE FROM dead_letter_queue 
  WHERE retry_count >= max_retries 
  AND created_at < now() - interval '30 days';
  $$
);

-- Create a function to check email system alerts
CREATE OR REPLACE FUNCTION check_email_system_alerts()
RETURNS void AS $$
DECLARE
  success_rate numeric;
  bounce_rate numeric;
  dlq_count integer;
  recent_failures integer;
  should_alert boolean := false;
  alert_details jsonb := '{}';
BEGIN
  -- Calculate success rate in last hour
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE delivery_status IN ('sent', 'delivered'))::numeric / COUNT(*)) * 100
      ELSE 100
    END INTO success_rate
  FROM email_delivery_tracking
  WHERE created_at >= now() - interval '1 hour';
  
  -- Calculate bounce rate in last 24 hours
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE delivery_status = 'bounced')::numeric / COUNT(*)) * 100
      ELSE 0
    END INTO bounce_rate
  FROM email_delivery_tracking
  WHERE created_at >= now() - interval '24 hours';
  
  -- Count DLQ items
  SELECT COUNT(*) INTO dlq_count
  FROM dead_letter_queue
  WHERE operation_type = 'email_send';
  
  -- Count recent failures
  SELECT COUNT(*) INTO recent_failures
  FROM service_health_metrics
  WHERE service_name = 'email_service'
  AND metric_type = 'send_failure'
  AND timestamp >= now() - interval '1 hour';
  
  -- Check alert conditions
  IF success_rate < 95 THEN
    should_alert := true;
    alert_details := alert_details || jsonb_build_object('low_success_rate', success_rate);
  END IF;
  
  IF bounce_rate > 5 THEN
    should_alert := true;
    alert_details := alert_details || jsonb_build_object('high_bounce_rate', bounce_rate);
  END IF;
  
  IF dlq_count > 100 THEN
    should_alert := true;
    alert_details := alert_details || jsonb_build_object('high_dlq_count', dlq_count);
  END IF;
  
  IF recent_failures > 10 THEN
    should_alert := true;
    alert_details := alert_details || jsonb_build_object('recent_failures', recent_failures);
  END IF;
  
  -- Log alert if needed
  IF should_alert THEN
    INSERT INTO cron_job_logs (job_name, status, details)
    VALUES (
      'email_system_alert',
      'alert',
      jsonb_build_object(
        'success_rate', success_rate,
        'bounce_rate', bounce_rate,
        'dlq_count', dlq_count,
        'recent_failures', recent_failures,
        'alert_details', alert_details,
        'timestamp', now()
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule alert checking every hour
SELECT cron.schedule(
  'email-system-alerts',
  '0 * * * *',
  $$
  SELECT check_email_system_alerts();
  $$
);