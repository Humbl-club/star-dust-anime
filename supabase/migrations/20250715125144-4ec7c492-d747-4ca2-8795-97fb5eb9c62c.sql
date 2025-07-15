-- Production-ready email verification database setup
-- Fix the auth webhook trigger and add proper error handling

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.notify_auth_webhook();

-- Create optimized webhook notification function
CREATE OR REPLACE FUNCTION public.notify_auth_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Only trigger for user creation/confirmation events
  IF (TG_OP = 'INSERT' AND NEW.email_confirmed_at IS NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) THEN
    
    -- Use pg_background for non-blocking execution
    PERFORM pg_background_launch(
      format('
        SELECT extensions.http_post(
          %L,
          %L,
          %L,
          %L
        )',
        'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/send-auth-emails',
        jsonb_build_object(
          'record', row_to_json(NEW),
          'old_record', row_to_json(OLD),
          'event_type', TG_OP,
          'token', NEW.confirmation_token,
          'token_hash', NEW.confirmation_token,
          'user_id', NEW.id,
          'email', NEW.email
        ),
        'application/json',
        jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
          'Content-Type', 'application/json'
        )
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

-- Create email verification status tracking table
CREATE TABLE IF NOT EXISTS public.email_verification_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create function to check and update verification status
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
BEGIN
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

-- Create function to resend verification email
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
  result jsonb;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id_param;
  
  IF user_email IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
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
  PERFORM extensions.http_post(
    'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/send-auth-emails',
    jsonb_build_object(
      'email', user_email,
      'user_id', user_id_param,
      'email_action_type', 'resend_confirmation',
      'token', gen_random_uuid()::text,
      'redirect_to', 'https://7fc28aed-a663-4753-8877-1ca39b8ccf8c.lovableproject.com/'
    ),
    'application/json',
    jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    )
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Verification email sent');
END;
$$;