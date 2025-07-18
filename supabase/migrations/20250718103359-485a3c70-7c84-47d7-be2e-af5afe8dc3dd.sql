-- Phase 1: Critical Database Security Fixes

-- Fix function search paths (addressing linter warnings)
ALTER FUNCTION public.get_anime_detail(uuid) SET search_path = '';
ALTER FUNCTION public.get_manga_detail(uuid) SET search_path = '';
ALTER FUNCTION public.get_title_validation_stats(uuid) SET search_path = '';
ALTER FUNCTION public.log_service_metric(text, text, numeric, jsonb) SET search_path = '';
ALTER FUNCTION public.add_to_dead_letter_queue(text, jsonb, text, integer) SET search_path = '';
ALTER FUNCTION public.cleanup_old_rate_limits() SET search_path = '';

-- Enable RLS on service_metrics table (addressing critical RLS error)
ALTER TABLE public.service_metrics ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for service_metrics
CREATE POLICY "Service role manages service metrics" ON public.service_metrics
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create enhanced rate limiting function for authentication
CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(user_ip text, action_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_time timestamptz := now();
  window_start timestamptz := current_time - interval '15 minutes';
  attempt_count integer := 0;
  max_attempts integer := 3;
BEGIN
  -- Count attempts in the last 15 minutes for this IP and action
  SELECT COUNT(*) INTO attempt_count
  FROM public.rate_limit_tracking
  WHERE user_id::text = user_ip
    AND resource_type = action_type
    AND window_start >= window_start;
  
  -- Check if rate limit exceeded
  IF attempt_count >= max_attempts THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'attempts', attempt_count,
      'max_attempts', max_attempts,
      'reset_time', window_start + interval '15 minutes'
    );
  END IF;
  
  -- Log this attempt
  INSERT INTO public.rate_limit_tracking (
    user_id, resource_type, window_start, window_end, request_count
  ) VALUES (
    user_ip::uuid, action_type, window_start, current_time, 1
  )
  ON CONFLICT (user_id, resource_type, window_start, window_end)
  DO UPDATE SET 
    request_count = rate_limit_tracking.request_count + 1,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'allowed', true,
    'attempts', attempt_count + 1,
    'max_attempts', max_attempts
  );
END;
$$;

-- Create session management table for enhanced security
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 minutes'),
  is_active boolean DEFAULT true,
  user_agent text,
  ip_address inet
);

-- Enable RLS on sessions table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Session policies
CREATE POLICY "Users manage own sessions" ON public.user_sessions
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create security audit log table
CREATE TABLE public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "Service role manages audit logs" ON public.security_audit_log
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  user_id_param uuid,
  event_type_param text,
  event_data_param jsonb DEFAULT '{}',
  severity_param text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, event_type, event_data, severity
  ) VALUES (
    user_id_param, event_type_param, event_data_param, severity_param
  );
END;
$$;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
  
  -- Delete old inactive sessions (older than 7 days)
  DELETE FROM public.user_sessions 
  WHERE is_active = false 
    AND created_at < now() - interval '7 days';
END;
$$;