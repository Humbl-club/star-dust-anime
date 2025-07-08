-- Complete System Overhaul: Fix triggers and create atomic initialization

-- First, ensure the missing trigger exists with proper security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  initialization_result RECORD;
BEGIN
  -- Simple profile creation only - no complex initialization
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fix the assign_random_username function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.assign_random_username(user_id_param uuid)
RETURNS TABLE(username text, tier username_tier)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  random_val float;
  selected_username text;
  selected_tier username_tier;
BEGIN
  -- Generate random value for tier selection
  random_val := random();
  
  -- Determine tier based on probability
  IF random_val <= 0.0001 THEN -- 0.01% chance for GOD
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'GOD' 
    AND up.name NOT IN (SELECT username FROM claimed_usernames WHERE is_active = true)
    ORDER BY random()
    LIMIT 1;
  ELSIF random_val <= 0.005 THEN -- 0.5% chance for LEGENDARY
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'LEGENDARY'
    ORDER BY random()
    LIMIT 1;
  ELSIF random_val <= 0.05 THEN -- 5% chance for EPIC
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'EPIC'
    ORDER BY random()
    LIMIT 1;
  ELSIF random_val <= 0.2 THEN -- 15% chance for RARE
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'RARE'
    ORDER BY random()
    LIMIT 1;
  ELSIF random_val <= 0.5 THEN -- 30% chance for UNCOMMON
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'UNCOMMON'
    ORDER BY random()
    LIMIT 1;
  ELSE -- 49.49% chance for COMMON
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'COMMON'
    ORDER BY random()
    LIMIT 1;
  END IF;
  
  -- If no username found, fallback to COMMON
  IF selected_username IS NULL THEN
    SELECT up.name, up.tier INTO selected_username, selected_tier
    FROM username_pool up
    WHERE up.tier = 'COMMON'
    ORDER BY random()
    LIMIT 1;
  END IF;
  
  -- Claim the username
  INSERT INTO claimed_usernames (username, user_id, tier)
  VALUES (selected_username, user_id_param, selected_tier);
  
  -- Update profile with username
  UPDATE profiles SET username = selected_username WHERE id = user_id_param;
  
  RETURN QUERY SELECT selected_username, selected_tier;
END;
$$;

-- Create atomic user initialization function
CREATE OR REPLACE FUNCTION public.initialize_user_atomic(user_id_param uuid)
RETURNS TABLE(
  success boolean,
  username text,
  tier text,
  total_points integer,
  loot_boxes_given integer,
  is_first_time boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean := false;
  assigned_username_result RECORD;
  is_new_user boolean := true;
BEGIN
  -- Check if user already initialized
  SELECT EXISTS(
    SELECT 1 FROM user_points WHERE user_id = user_id_param
  ) INTO user_exists;
  
  IF user_exists THEN
    -- User already initialized, just return current data
    SELECT 
      true,
      cu.username,
      cu.tier::text,
      up.total_points,
      0,
      false,
      'User already initialized'
    INTO success, username, tier, total_points, loot_boxes_given, is_first_time, message
    FROM user_points up
    LEFT JOIN claimed_usernames cu ON cu.user_id = user_id_param AND cu.is_active = true
    WHERE up.user_id = user_id_param;
    
    RETURN QUERY SELECT success, username, tier, total_points, loot_boxes_given, is_first_time, message;
    RETURN;
  END IF;
  
  -- Initialize everything atomically
  BEGIN
    -- 1. Initialize points
    INSERT INTO user_points (user_id, total_points, daily_points, login_streak)
    VALUES (user_id_param, 100, 0, 0); -- Give 100 starting points
    
    -- 2. Assign username
    SELECT * INTO assigned_username_result
    FROM public.assign_random_username(user_id_param);
    
    -- 3. Give starter loot box
    INSERT INTO user_loot_boxes (user_id, box_type, quantity)
    VALUES (user_id_param, 'standard', 1);
    
    -- 4. Record initial activity
    INSERT INTO daily_activities (user_id, activity_type, points_earned, metadata)
    VALUES (user_id_param, 'signup_bonus', 100, jsonb_build_object(
      'username_assigned', assigned_username_result.username,
      'tier', assigned_username_result.tier,
      'signup_date', now()
    ));
    
    RETURN QUERY SELECT 
      true,
      assigned_username_result.username,
      assigned_username_result.tier::text,
      100,
      1,
      true,
      'User initialized successfully';
      
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        false,
        'Error'::text,
        'COMMON'::text,
        0,
        0,
        false,
        SQLERRM;
  END;
END;
$$;

-- Clean up duplicate login activities for the problematic user
DELETE FROM daily_activities 
WHERE user_id IN (
  SELECT user_id 
  FROM daily_activities 
  WHERE activity_type = 'login' 
  GROUP BY user_id 
  HAVING COUNT(*) > 50
) 
AND activity_type = 'login' 
AND id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM daily_activities 
  WHERE activity_type = 'login' 
  ORDER BY user_id, created_at DESC
);

-- Reset excessive points for users with login spam
UPDATE user_points 
SET 
  total_points = LEAST(total_points, 500),
  daily_points = 0
WHERE user_id IN (
  SELECT user_id 
  FROM daily_activities 
  WHERE activity_type = 'login' 
  GROUP BY user_id 
  HAVING COUNT(*) > 10
);