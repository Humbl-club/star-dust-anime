-- Remove points system and fix ambiguous column error

-- 1. Drop existing functions first
DROP FUNCTION IF EXISTS public.initialize_user_atomic(uuid);
DROP FUNCTION IF EXISTS public.get_user_gamification_summary(uuid);

-- 2. Drop unused points-related tables
DROP TABLE IF EXISTS daily_activities CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;

-- 3. Drop unused points-related functions
DROP FUNCTION IF EXISTS add_user_points(uuid, integer);
DROP FUNCTION IF EXISTS process_daily_login(uuid);
DROP FUNCTION IF EXISTS reset_daily_points();
DROP FUNCTION IF EXISTS is_first_loot_box(uuid);
DROP FUNCTION IF EXISTS mark_first_loot_box_opened(uuid);

-- 4. Create new simplified initialize_user_atomic function
CREATE OR REPLACE FUNCTION public.initialize_user_atomic(user_id_param uuid)
RETURNS TABLE(success boolean, username text, tier text, is_first_time boolean, needs_welcome boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_exists boolean := false;
  has_username boolean := false;
  assigned_username_result RECORD;
  should_show_welcome boolean := false;
BEGIN
  -- Check if user has an active username
  SELECT EXISTS(
    SELECT 1 FROM claimed_usernames 
    WHERE user_id = user_id_param AND is_active = true
  ) INTO has_username;
  
  -- Check if user exists in profiles (simple existence check)
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = user_id_param
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
$function$;

-- 5. Create simplified get_user_gamification_summary function
CREATE OR REPLACE FUNCTION public.get_user_gamification_summary(user_id_param uuid)
RETURNS TABLE(login_streak integer, current_username text, username_tier text, loot_boxes jsonb, recent_activities jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      0 as streak, -- No more login streak tracking
      COALESCE(cu.username, 'Unknown') as current_user,
      COALESCE(cu.tier::text, 'COMMON') as user_tier
    FROM claimed_usernames cu 
    WHERE cu.user_id = user_id_param AND cu.is_active = true
    LIMIT 1
  ),
  user_boxes AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'box_type', box_type,
        'quantity', quantity
      )
    ) FILTER (WHERE quantity > 0), '[]'::jsonb) as boxes
    FROM user_loot_boxes
    WHERE user_id = user_id_param
  ),
  user_activities AS (
    SELECT '[]'::jsonb as activities -- No more activity tracking
  )
  SELECT 
    COALESCE(us.streak, 0),
    COALESCE(us.current_user, 'Unknown'),
    COALESCE(us.user_tier, 'COMMON'),
    COALESCE(ub.boxes, '[]'::jsonb),
    COALESCE(ua.activities, '[]'::jsonb)
  FROM user_stats us
  CROSS JOIN user_boxes ub
  CROSS JOIN user_activities ua;
END;
$function$;