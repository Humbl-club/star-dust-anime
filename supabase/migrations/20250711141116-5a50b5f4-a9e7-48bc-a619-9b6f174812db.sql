-- Fix SQL ambiguity error in initialize_user_atomic function and create missing profile
-- Step 1: Fix the initialize_user_atomic function to resolve SQL ambiguity
CREATE OR REPLACE FUNCTION public.initialize_user_atomic(user_id_param uuid)
RETURNS TABLE(success boolean, username text, tier text, is_first_time boolean, needs_welcome boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean := false;
  has_username boolean := false;
  assigned_username_result RECORD;
  should_show_welcome boolean := false;
BEGIN
  -- Check if user has an active username
  SELECT EXISTS(
    SELECT 1 FROM claimed_usernames cu
    WHERE cu.user_id = user_id_param AND cu.is_active = true
  ) INTO has_username;
  
  -- Check if user exists in profiles (simple existence check)
  SELECT EXISTS(
    SELECT 1 FROM profiles p WHERE p.id = user_id_param
  ) INTO user_exists;
  
  -- Determine if user needs welcome animation (new user OR missing username)
  should_show_welcome := NOT user_exists OR NOT has_username;
  
  IF user_exists AND has_username THEN
    -- User already fully initialized, just return current data
    SELECT 
      true,
      cu.username,
      cu.tier::text,
      false,
      false,
      'User already initialized'
    INTO success, username, tier, is_first_time, needs_welcome, message
    FROM claimed_usernames cu 
    WHERE cu.user_id = user_id_param AND cu.is_active = true
    LIMIT 1;
    
    RETURN QUERY SELECT success, username, tier, is_first_time, needs_welcome, message;
    RETURN;
  END IF;
  
  -- Initialize or repair user account atomically
  BEGIN
    -- Create profile if missing
    IF NOT user_exists THEN
      INSERT INTO profiles (id, full_name)
      VALUES (user_id_param, COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_id_param),
        (SELECT email FROM auth.users WHERE id = user_id_param)
      ))
      ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- Assign username if missing
    IF NOT has_username THEN
      SELECT * INTO assigned_username_result
      FROM public.assign_random_username(user_id_param);
    ELSE
      -- Get existing username
      SELECT cu.username, cu.tier INTO assigned_username_result.username, assigned_username_result.tier
      FROM claimed_usernames cu 
      WHERE cu.user_id = user_id_param AND cu.is_active = true
      LIMIT 1;
    END IF;
    
    RETURN QUERY SELECT 
      true,
      assigned_username_result.username,
      assigned_username_result.tier::text,
      NOT user_exists, -- is_first_time
      should_show_welcome, -- needs_welcome
      CASE WHEN user_exists THEN 'User account repaired' ELSE 'User initialized successfully' END;
      
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        false,
        'Error'::text,
        'COMMON'::text,
        false,
        false,
        SQLERRM;
  END;
END;
$$;

-- Step 2: Manually create profile for the user who's stuck (from auth logs - b7183c5e-a070-4bb4-986c-8904b638173b)
DO $$
BEGIN
  -- Check if the user from the latest signup exists and create profile if missing
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = 'b7183c5e-a070-4bb4-986c-8904b638173b') THEN
    INSERT INTO profiles (id, full_name)
    SELECT 
      id, 
      COALESCE(raw_user_meta_data->>'full_name', email)
    FROM auth.users 
    WHERE id = 'b7183c5e-a070-4bb4-986c-8904b638173b'
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Profile created/verified for user b7183c5e-a070-4bb4-986c-8904b638173b';
  END IF;
END $$;