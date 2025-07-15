-- Production-ready email verification system
-- Fix critical issues with the current implementation

-- Drop existing problematic triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.notify_auth_webhook();

-- Create simplified webhook notification function using available extensions
CREATE OR REPLACE FUNCTION public.notify_auth_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Only trigger for user creation/confirmation events
  IF (TG_OP = 'INSERT' AND NEW.email_confirmed_at IS NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) THEN
    
    -- Use net.http_post which is available in Supabase
    PERFORM net.http_post(
      url := 'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/send-auth-emails',
      headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUwOTQ3OSwiZXhwIjoyMDYzMDg1NDc5fQ.FjJJVmALxXMWWOjMVZwQ7xsJ8IKILGiJ8jfpBQNPFJ8", "Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD),
        'event_type', TG_OP,
        'token', COALESCE(NEW.confirmation_token, 'no-token'),
        'token_hash', COALESCE(NEW.confirmation_token, 'no-token'),
        'user_id', NEW.id,
        'email', NEW.email,
        'redirect_to', 'https://7fc28aed-a663-4753-8877-1ca39b8ccf8c.lovableproject.com/'
      )
    );
    
    -- Log the webhook attempt for monitoring
    INSERT INTO public.cron_job_logs (job_name, status, details)
    VALUES (
      'auth_webhook_trigger',
      'initiated',
      jsonb_build_object(
        'event_type', TG_OP,
        'user_id', NEW.id,
        'email', NEW.email,
        'has_token', (NEW.confirmation_token IS NOT NULL),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_auth_webhook();

-- Ensure email verification status table exists with proper structure
CREATE TABLE IF NOT EXISTS public.email_verification_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'expired')),
  verification_token text,
  verification_sent_at timestamp with time zone DEFAULT now(),
  verification_expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  verification_attempts integer DEFAULT 0,
  last_attempt_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Enable RLS on email verification status
ALTER TABLE public.email_verification_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email verification
CREATE POLICY "Users can view their own verification status"
  ON public.email_verification_status
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification status"
  ON public.email_verification_status
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage verification status"
  ON public.email_verification_status
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update the check_email_verification_status function to be more robust
CREATE OR REPLACE FUNCTION public.check_email_verification_status(user_id_param uuid)
RETURNS TABLE(
  is_verified boolean,
  verification_status text,
  days_remaining integer,
  verification_expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_profile RECORD;
  verification_record RECORD;
  auth_user RECORD;
BEGIN
  -- Get auth user data
  SELECT * INTO auth_user
  FROM auth.users
  WHERE id = user_id_param;
  
  -- Get user profile
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE id = user_id_param;
  
  -- Get verification status
  SELECT * INTO verification_record
  FROM public.email_verification_status
  WHERE user_id = user_id_param
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if user is verified through auth.users email_confirmed_at
  IF auth_user.email_confirmed_at IS NOT NULL THEN
    -- User is verified through Supabase auth
    RETURN QUERY SELECT 
      true as is_verified,
      'verified'::text as verification_status,
      NULL::integer as days_remaining,
      NULL::timestamp with time zone as verification_expires_at;
    RETURN;
  END IF;
  
  -- If no verification record exists, check profile status
  IF verification_record IS NULL THEN
    -- Check if user is already verified through profile
    IF user_profile.verification_status = 'verified' THEN
      RETURN QUERY SELECT 
        true as is_verified,
        'verified'::text as verification_status,
        NULL::integer as days_remaining,
        NULL::timestamp with time zone as verification_expires_at;
    ELSE
      RETURN QUERY SELECT 
        false as is_verified,
        COALESCE(user_profile.verification_status, 'pending')::text as verification_status,
        EXTRACT(days FROM (COALESCE(user_profile.verification_required_until, now() + interval '7 days') - now()))::integer as days_remaining,
        COALESCE(user_profile.verification_required_until, now() + interval '7 days') as verification_expires_at;
    END IF;
  ELSE
    -- Check if verification has expired
    IF verification_record.verification_expires_at < now() AND verification_record.verification_status = 'pending' THEN
      -- Update status to expired
      UPDATE public.email_verification_status
      SET verification_status = 'expired',
          updated_at = now()
      WHERE id = verification_record.id;
      
      verification_record.verification_status := 'expired';
    END IF;
    
    RETURN QUERY SELECT 
      (verification_record.verification_status = 'verified') as is_verified,
      verification_record.verification_status,
      CASE 
        WHEN verification_record.verification_status = 'verified' THEN NULL
        ELSE EXTRACT(days FROM (verification_record.verification_expires_at - now()))::integer
      END as days_remaining,
      verification_record.verification_expires_at;
  END IF;
END;
$$;

-- Update the resend_verification_email function
CREATE OR REPLACE FUNCTION public.resend_verification_email(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_email text;
  last_sent timestamp with time zone;
  attempts integer;
  auth_user RECORD;
BEGIN
  -- Get user data from auth.users
  SELECT * INTO auth_user
  FROM auth.users
  WHERE id = user_id_param;
  
  IF auth_user.email IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  user_email := auth_user.email;
  
  -- Check if user is already verified
  IF auth_user.email_confirmed_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Email is already verified');
  END IF;
  
  -- Check rate limiting (max 3 attempts per hour)
  SELECT verification_attempts, last_attempt_at
  INTO attempts, last_sent
  FROM public.email_verification_status
  WHERE user_id = user_id_param
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF attempts >= 3 AND last_sent > (now() - interval '1 hour') THEN
    RETURN jsonb_build_object(
      'error', 'Rate limit exceeded. Please wait before requesting another verification email.'
    );
  END IF;
  
  -- Update or insert verification status
  INSERT INTO public.email_verification_status (
    user_id, email, verification_status, verification_attempts, last_attempt_at
  ) VALUES (
    user_id_param, user_email, 'pending', 1, now()
  )
  ON CONFLICT (user_id, email) DO UPDATE SET
    verification_attempts = CASE 
      WHEN email_verification_status.last_attempt_at < (now() - interval '1 hour') THEN 1
      ELSE email_verification_status.verification_attempts + 1
    END,
    last_attempt_at = now(),
    verification_sent_at = now(),
    verification_expires_at = now() + interval '7 days',
    updated_at = now();
  
  -- Call the edge function to send email
  PERFORM net.http_post(
    url := 'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/send-auth-emails',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUwOTQ3OSwiZXhwIjoyMDYzMDg1NDc5fQ.FjJJVmALxXMWWOjMVZwQ7xsJ8IKILGiJ8jfpBQNPFJ8", "Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'email', user_email,
      'user_id', user_id_param,
      'email_action_type', 'signup',
      'token', COALESCE(auth_user.confirmation_token, gen_random_uuid()::text),
      'token_hash', COALESCE(auth_user.confirmation_token, gen_random_uuid()::text),
      'redirect_to', 'https://7fc28aed-a663-4753-8877-1ca39b8ccf8c.lovableproject.com/'
    )
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Verification email sent');
END;
$$;