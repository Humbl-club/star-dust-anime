-- Enable webhook for auth events to trigger custom email sending
-- This will allow us to intercept signup events and send custom emails

-- First, let's ensure we have the necessary configuration for auth webhooks
-- We'll add a function to handle auth webhook events if needed

-- Create a simple function to log auth events (for debugging)
CREATE OR REPLACE FUNCTION log_auth_event()
RETURNS trigger AS $$
BEGIN
  -- Log the auth event for debugging
  INSERT INTO cron_job_logs (job_name, status, details)
  VALUES (
    'auth_webhook_trigger',
    'success',
    jsonb_build_object(
      'event_type', TG_OP,
      'user_id', COALESCE(NEW.id, OLD.id),
      'email', COALESCE(NEW.email, OLD.email),
      'confirmed_at', COALESCE(NEW.email_confirmed_at, OLD.email_confirmed_at)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The actual webhook configuration needs to be done in Supabase Dashboard
-- under Authentication > Webhooks. We'll create a database function to help
-- with webhook payload processing if needed.

-- Create a function to process webhook data (can be called from edge functions)
CREATE OR REPLACE FUNCTION process_auth_webhook(
  event_type text,
  user_data jsonb
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Process different auth events
  CASE event_type
    WHEN 'user.created' THEN
      -- Handle new user creation
      result := jsonb_build_object(
        'action', 'send_confirmation_email',
        'email', user_data->>'email',
        'user_id', user_data->>'id'
      );
    WHEN 'user.confirmation_sent' THEN
      -- Handle confirmation resend
      result := jsonb_build_object(
        'action', 'resend_confirmation_email',
        'email', user_data->>'email',
        'user_id', user_data->>'id'
      );
    ELSE
      result := jsonb_build_object('action', 'none');
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;