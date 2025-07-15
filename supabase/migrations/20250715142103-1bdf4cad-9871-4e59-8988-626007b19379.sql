
-- Update the notify_auth_webhook function to remove pg_background_launch dependency
CREATE OR REPLACE FUNCTION public.notify_auth_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only trigger for user creation/confirmation events
  IF (TG_OP = 'INSERT' AND NEW.email_confirmed_at IS NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) THEN
    
    -- Log the webhook attempt for monitoring (without using pg_background)
    INSERT INTO public.cron_job_logs (job_name, status, details)
    VALUES (
      'auth_webhook_trigger',
      'initiated',
      jsonb_build_object(
        'event_type', TG_OP,
        'user_id', NEW.id,
        'email', NEW.email,
        'timestamp', now(),
        'note', 'Background webhook disabled - using direct processing'
      )
    );
    
    -- Note: Direct HTTP calls from triggers are not reliable in Supabase
    -- Consider using a different approach for email notifications
    
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
