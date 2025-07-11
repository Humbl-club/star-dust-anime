-- Fix the initialize_user_atomic function by properly qualifying column references

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
      true as success_val,
      cu.username as username_val,
      cu.tier::text as tier_val,
      false as is_first_time_val,
      false as needs_welcome_val,
      'User already initialized' as message_val
    INTO success, username, tier, is_first_time, needs_welcome, message
    FROM claimed_usernames cu 
    WHERE cu.user_id = user_id_param AND cu.is_active = true
    LIMIT 1;
    
    RETURN NEXT;
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
      SELECT 
        assign_result.username,
        assign_result.tier
      INTO assigned_username_result.username, assigned_username_result.tier
      FROM public.assign_random_username(user_id_param) as assign_result;
    ELSE
      -- Get existing username
      SELECT cu.username, cu.tier::text 
      INTO assigned_username_result.username, assigned_username_result.tier
      FROM claimed_usernames cu 
      WHERE cu.user_id = user_id_param AND cu.is_active = true
      LIMIT 1;
    END IF;
    
    RETURN QUERY SELECT 
      true as success_val,
      assigned_username_result.username as username_val,
      assigned_username_result.tier::text as tier_val,
      NOT user_exists as is_first_time_val, -- is_first_time
      should_show_welcome as needs_welcome_val, -- needs_welcome
      CASE WHEN user_exists THEN 'User account repaired' ELSE 'User initialized successfully' END as message_val;
      
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        false as success_val,
        'Error'::text as username_val,
        'COMMON'::text as tier_val,
        false as is_first_time_val,
        false as needs_welcome_val,
        SQLERRM as message_val;
  END;
END;
$$;