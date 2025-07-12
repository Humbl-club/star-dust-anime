-- Update the handle_new_user_simple function to automatically verify Google OAuth users
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Determine verification status based on auth provider
  -- Google OAuth users should be automatically verified
  DECLARE
    should_verify boolean := false;
    provider_name text;
  BEGIN
    -- Check if user signed up with OAuth (Google)
    -- OAuth users have app_metadata.provider set
    provider_name := NEW.raw_app_meta_data->>'provider';
    
    -- Google OAuth users are automatically verified
    should_verify := (provider_name = 'google') OR (NEW.email_confirmed_at IS NOT NULL);
    
    -- Insert basic profile with appropriate verification status
    INSERT INTO public.profiles (
      id, 
      full_name, 
      avatar_url,
      verification_status,
      verification_required_until
    )
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
      NEW.raw_user_meta_data->>'avatar_url',
      CASE 
        WHEN should_verify THEN 'verified'
        ELSE 'pending'
      END,
      CASE 
        WHEN should_verify THEN NULL
        ELSE now() + interval '7 days'
      END
    )
    ON CONFLICT (id) DO UPDATE SET
      verification_status = CASE 
        WHEN should_verify THEN 'verified'
        ELSE EXCLUDED.verification_status
      END,
      verification_required_until = CASE 
        WHEN should_verify THEN NULL
        ELSE EXCLUDED.verification_required_until
      END;
    
    RETURN NEW;
  END;
END;
$function$;