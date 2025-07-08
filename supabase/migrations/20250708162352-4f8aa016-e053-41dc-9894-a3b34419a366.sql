-- Fix database function conflicts and improve user initialization
-- Remove old trigger-based initialize_user_gamification function
DROP FUNCTION IF EXISTS public.initialize_user_gamification() CASCADE;

-- Ensure the parameter-based version exists and is correct
CREATE OR REPLACE FUNCTION public.initialize_user_gamification(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create points record
  INSERT INTO user_points (user_id, total_points, daily_points)
  VALUES (user_id_param, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Give starter loot box
  INSERT INTO user_loot_boxes (user_id, box_type, quantity)
  VALUES (user_id_param, 'standard', 1)
  ON CONFLICT (user_id, box_type) DO UPDATE SET quantity = user_loot_boxes.quantity + 1;
END;
$$;

-- Ensure handle_new_user function is robust and handles mobile auth properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  assigned_username_result RECORD;
  user_data RECORD;
BEGIN
  -- Get user data safely
  SELECT raw_user_meta_data INTO user_data FROM auth.users WHERE id = NEW.id;
  
  -- Insert basic profile first (username will be updated by assign_random_username)
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(user_data.raw_user_meta_data->>'full_name', NEW.email),
    user_data.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
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
  
  -- Process daily login bonus for new user with error handling
  BEGIN
    PERFORM public.process_daily_login(NEW.id);
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Failed to process daily login for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();