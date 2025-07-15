-- Create the missing initialize_user_gamification function
CREATE OR REPLACE FUNCTION public.initialize_user_gamification(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create points record
  INSERT INTO public.user_points (user_id, total_points, daily_points)
  VALUES (user_id_param, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Give starter loot box
  INSERT INTO public.user_loot_boxes (user_id, box_type, quantity)
  VALUES (user_id_param, 'standard', 1)
  ON CONFLICT (user_id, box_type) DO UPDATE SET quantity = user_loot_boxes.quantity + 1;
END;
$$;

-- Create comprehensive handle_new_user function
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
      -- Call the edge function to send verification email
      PERFORM extensions.http_post(
        'https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/send-auth-emails',
        jsonb_build_object(
          'email', NEW.email,
          'user_id', NEW.id,
          'email_action_type', 'signup',
          'token', encode(gen_random_bytes(32), 'base64'),
          'redirect_to', 'https://7fc28aed-a663-4753-8877-1ca39b8ccf8c.lovableproject.com/'
        ),
        'application/json',
        jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
          'Content-Type', 'application/json'
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to send verification email for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remove any conflicting triggers
DROP TRIGGER IF EXISTS notify_auth_webhook ON auth.users;
DROP TRIGGER IF EXISTS log_auth_event ON auth.users;

-- Ensure our main trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();