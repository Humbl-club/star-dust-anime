-- Fix the gen_random_uuid typo and improve error handling in handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_username_result RECORD;
  user_data RECORD;
  should_verify boolean := false;
  provider_name text;
  http_response record;
BEGIN
  -- Get user data safely
  SELECT raw_user_meta_data, raw_app_meta_data INTO user_data FROM auth.users WHERE id = NEW.id;
  
  -- Check if user signed up with OAuth (Google)
  provider_name := user_data.raw_app_meta_data->>'provider';
  should_verify := (provider_name = 'google') OR (NEW.email_confirmed_at IS NOT NULL);
  
  -- Insert basic profile first
  INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url,
    verification_status,
    verification_required_until
  )
  VALUES (
    NEW.id, 
    COALESCE(user_data.raw_user_meta_data->>'full_name', NEW.email),
    user_data.raw_user_meta_data->>'avatar_url',
    CASE WHEN should_verify THEN 'verified' ELSE 'pending' END,
    CASE WHEN should_verify THEN NULL ELSE now() + interval '7 days' END
  )
  ON CONFLICT (id) DO UPDATE SET
    verification_status = CASE WHEN should_verify THEN 'verified' ELSE EXCLUDED.verification_status END,
    verification_required_until = CASE WHEN should_verify THEN NULL ELSE EXCLUDED.verification_required_until END;
  
  -- Initialize gamification systems with proper error handling
  BEGIN
    PERFORM public.initialize_user_gamification(NEW.id);
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Failed to initialize gamification for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Assign random username automatically with error handling
  BEGIN
    SELECT * INTO assigned_username_result
    FROM public.assign_random_username(NEW.id);
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Failed to assign username for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Send verification email for email/password users (not OAuth)
  IF provider_name IS NULL OR provider_name != 'google' THEN
    BEGIN
      -- Call the edge function to send verification email using the correct http_post function
      SELECT * INTO http_response FROM public.http_post(
        'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/send-auth-emails',
        jsonb_build_object(
          'email', NEW.email,
          'user_id', NEW.id,
          'email_action_type', 'signup',
          'token', gen_random_uuid()::text,  -- FIXED: was gen_rando
          'redirect_to', 'https://7fc28aed-a663-4753-8877-1ca39b8ccf8c.lovableproject.com/'
        )::text,
        'application/json'
      );
      
      -- Log the response for debugging
      RAISE WARNING 'Email function response: status=%, content=%', 
        http_response.status, 
        http_response.content;
        
    EXCEPTION
      WHEN OTHERS THEN
        -- Log detailed error but don't fail user creation
        RAISE WARNING 'Failed to send verification email for user %: % (SQLSTATE: %)', 
          NEW.id, SQLERRM, SQLSTATE;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;