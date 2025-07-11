-- Simplify the initialize_user_atomic function to avoid record issues

CREATE OR REPLACE FUNCTION public.initialize_user_atomic(user_id_param uuid)
RETURNS TABLE(success boolean, username text, tier text, is_first_time boolean, needs_welcome boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean := false;
  has_username boolean := false;
  assigned_username text;
  assigned_tier text;
  should_show_welcome boolean := false;
BEGIN
  -- Check if user has an active username
  SELECT EXISTS(
    SELECT 1 FROM claimed_usernames cu
    WHERE cu.user_id = user_id_param AND cu.is_active = true
  ) INTO has_username;
  
  -- Check if user exists in profiles
  SELECT EXISTS(
    SELECT 1 FROM profiles p WHERE p.id = user_id_param
  ) INTO user_exists;
  
  -- Determine if user needs welcome animation
  should_show_welcome := NOT user_exists OR NOT has_username;
  
  IF user_exists AND has_username THEN
    -- User already fully initialized, just return current data
    SELECT cu.username, cu.tier::text
    INTO assigned_username, assigned_tier
    FROM claimed_usernames cu 
    WHERE cu.user_id = user_id_param AND cu.is_active = true
    LIMIT 1;
    
    RETURN QUERY SELECT 
      true,
      assigned_username,
      assigned_tier,
      false,
      false,
      'User already initialized';
    RETURN;
  END IF;
  
  -- Initialize or repair user account
  BEGIN
    -- Create profile if missing
    IF NOT user_exists THEN
      INSERT INTO profiles (id, full_name)
      VALUES (user_id_param, COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_id_param),
        (SELECT email FROM auth.users WHERE id = user_id_param),
        'User'
      ))
      ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- Assign username if missing
    IF NOT has_username THEN
      -- Call assign_random_username and get the result
      SELECT assign_result.username, assign_result.tier::text
      INTO assigned_username, assigned_tier
      FROM public.assign_random_username(user_id_param) as assign_result;
    ELSE
      -- Get existing username
      SELECT cu.username, cu.tier::text 
      INTO assigned_username, assigned_tier
      FROM claimed_usernames cu 
      WHERE cu.user_id = user_id_param AND cu.is_active = true
      LIMIT 1;
    END IF;
    
    RETURN QUERY SELECT 
      true,
      assigned_username,
      assigned_tier,
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