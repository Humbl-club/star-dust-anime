
-- Check what status values are allowed in cron_job_logs and fix the function
-- First, let's see what the constraint allows and update accordingly
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
    
    -- Log the webhook attempt for monitoring using a valid status
    INSERT INTO public.cron_job_logs (job_name, status, details)
    VALUES (
      'auth_webhook_trigger',
      'completed',
      jsonb_build_object(
        'event_type', TG_OP,
        'user_id', NEW.id,
        'email', NEW.email,
        'timestamp', now(),
        'note', 'Auth event logged successfully'
      )
    );
    
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
