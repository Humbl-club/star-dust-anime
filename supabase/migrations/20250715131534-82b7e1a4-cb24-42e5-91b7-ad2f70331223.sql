-- Phase 1: Create production-ready database schema
-- Email delivery tracking table
CREATE TABLE email_delivery_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  correlation_id text NOT NULL,
  provider text NOT NULL DEFAULT 'resend',
  email_type text NOT NULL DEFAULT 'verification',
  delivery_status text NOT NULL DEFAULT 'queued',
  external_id text,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  failed_at timestamp with time zone,
  error_message text,
  retry_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Persistent rate limiting table
CREATE TABLE rate_limit_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_type text NOT NULL,
  window_start timestamp with time zone NOT NULL,
  window_end timestamp with time zone NOT NULL,
  request_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Service health monitoring table
CREATE TABLE service_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Dead letter queue for failed operations
CREATE TABLE dead_letter_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL,
  payload jsonb NOT NULL,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Email template cache
CREATE TABLE email_template_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_version text NOT NULL,
  rendered_html text NOT NULL,
  cache_key text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_email_delivery_user_id ON email_delivery_tracking(user_id);
CREATE INDEX idx_email_delivery_correlation_id ON email_delivery_tracking(correlation_id);
CREATE INDEX idx_email_delivery_status ON email_delivery_tracking(delivery_status);
CREATE INDEX idx_rate_limit_user_resource ON rate_limit_tracking(user_id, resource_type);
CREATE INDEX idx_rate_limit_window ON rate_limit_tracking(window_start, window_end);
CREATE INDEX idx_service_health_service_time ON service_health_metrics(service_name, timestamp);
CREATE INDEX idx_dlq_next_retry ON dead_letter_queue(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX idx_email_template_cache_key ON email_template_cache(cache_key);
CREATE INDEX idx_email_template_expires ON email_template_cache(expires_at);

-- Enable RLS
ALTER TABLE email_delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role manages email delivery tracking" ON email_delivery_tracking
  FOR ALL USING (true);

CREATE POLICY "Service role manages rate limiting" ON rate_limit_tracking
  FOR ALL USING (true);

CREATE POLICY "Service role manages health metrics" ON service_health_metrics
  FOR ALL USING (true);

CREATE POLICY "Service role manages dead letter queue" ON dead_letter_queue
  FOR ALL USING (true);

CREATE POLICY "Service role manages email template cache" ON email_template_cache
  FOR ALL USING (true);

-- Create functions for production operations
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id_param uuid,
  resource_type_param text,
  max_requests integer DEFAULT 3,
  window_minutes integer DEFAULT 60
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_time timestamptz := now();
  window_start timestamptz := current_time - (window_minutes || ' minutes')::interval;
  window_end timestamptz := current_time;
  current_count integer := 0;
  remaining_requests integer;
  reset_time timestamptz;
BEGIN
  -- Get current count for this user and resource within the window
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM rate_limit_tracking
  WHERE user_id = user_id_param
    AND resource_type = resource_type_param
    AND window_start >= window_start
    AND window_end <= window_end;

  -- Check if rate limit is exceeded
  IF current_count >= max_requests THEN
    -- Find the earliest reset time
    SELECT MIN(window_end) INTO reset_time
    FROM rate_limit_tracking
    WHERE user_id = user_id_param
      AND resource_type = resource_type_param
      AND window_start >= window_start;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'current_count', current_count,
      'max_requests', max_requests,
      'reset_time', reset_time,
      'remaining_time_seconds', EXTRACT(EPOCH FROM (reset_time - current_time))
    );
  END IF;

  -- Increment the rate limit counter
  INSERT INTO rate_limit_tracking (user_id, resource_type, window_start, window_end, request_count)
  VALUES (user_id_param, resource_type_param, window_start, window_end, 1)
  ON CONFLICT (user_id, resource_type, window_start, window_end) 
  DO UPDATE SET 
    request_count = rate_limit_tracking.request_count + 1,
    updated_at = now();

  remaining_requests := max_requests - (current_count + 1);
  
  RETURN jsonb_build_object(
    'allowed', true,
    'current_count', current_count + 1,
    'max_requests', max_requests,
    'remaining_requests', remaining_requests,
    'reset_time', window_end
  );
END;
$$;

CREATE OR REPLACE FUNCTION log_service_metric(
  service_name_param text,
  metric_type_param text,
  metric_value_param numeric,
  metadata_param jsonb DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO service_health_metrics (service_name, metric_type, metric_value, metadata)
  VALUES (service_name_param, metric_type_param, metric_value_param, metadata_param);
END;
$$;

CREATE OR REPLACE FUNCTION add_to_dead_letter_queue(
  operation_type_param text,
  payload_param jsonb,
  error_message_param text,
  max_retries_param integer DEFAULT 3
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  queue_id uuid;
BEGIN
  INSERT INTO dead_letter_queue (operation_type, payload, error_message, max_retries, next_retry_at)
  VALUES (
    operation_type_param, 
    payload_param, 
    error_message_param, 
    max_retries_param,
    now() + interval '5 minutes'
  )
  RETURNING id INTO queue_id;
  
  RETURN queue_id;
END;
$$;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_delivery_tracking_updated_at
  BEFORE UPDATE ON email_delivery_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_tracking_updated_at
  BEFORE UPDATE ON rate_limit_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dead_letter_queue_updated_at
  BEFORE UPDATE ON dead_letter_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Clean up old records functions
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits() RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limit_tracking 
  WHERE window_end < now() - interval '24 hours';
  
  DELETE FROM service_health_metrics 
  WHERE timestamp < now() - interval '7 days';
  
  DELETE FROM email_template_cache 
  WHERE expires_at < now();
END;
$$;