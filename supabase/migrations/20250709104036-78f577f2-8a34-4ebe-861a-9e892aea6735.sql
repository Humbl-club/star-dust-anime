
-- Remove all loot box features from database
-- Phase 1: Clean up database tables, functions, and columns

-- Drop loot box related functions
DROP FUNCTION IF EXISTS public.open_loot_box_secure(uuid, text);
DROP FUNCTION IF EXISTS public.is_first_loot_box(uuid);
DROP FUNCTION IF EXISTS public.mark_first_loot_box_opened(uuid);

-- Remove first_loot_box_opened column from user_points table
ALTER TABLE user_points DROP COLUMN IF EXISTS first_loot_box_opened;

-- Drop user_loot_boxes table entirely
DROP TABLE IF EXISTS user_loot_boxes;

-- Update initialize_user_atomic function to remove loot box references
CREATE OR REPLACE FUNCTION public.initialize_user_atomic(user_id_param uuid)
RETURNS TABLE(
  success boolean,
  username text,
  tier text,
  total_points integer,
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
      false,
      'User already initialized'
    INTO success, username, tier, total_points, is_first_time, message
    FROM user_points up
    LEFT JOIN claimed_usernames cu ON cu.user_id = user_id_param AND cu.is_active = true
    WHERE up.user_id = user_id_param;
    
    RETURN QUERY SELECT success, username, tier, total_points, is_first_time, message;
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
    
    -- 3. Record initial activity
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
      true,
      'User initialized successfully';
      
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        false,
        'Error'::text,
        'COMMON'::text,
        0,
        false,
        SQLERRM;
  END;
END;
$$;

-- Update get_user_gamification_summary function to remove loot box references
CREATE OR REPLACE FUNCTION public.get_user_gamification_summary(user_id_param uuid)
RETURNS TABLE(total_points integer, daily_points integer, login_streak integer, current_username text, username_tier text, recent_activities jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COALESCE(up.total_points, 0) as points_total,
      COALESCE(up.daily_points, 0) as points_daily,
      COALESCE(up.login_streak, 0) as streak,
      COALESCE(cu.username, 'Unknown') as current_user,
      COALESCE(cu.tier::text, 'COMMON') as user_tier
    FROM user_points up
    FULL OUTER JOIN claimed_usernames cu ON cu.user_id = user_id_param AND cu.is_active = true
    WHERE up.user_id = user_id_param OR up.user_id IS NULL
    LIMIT 1
  ),
  user_activities AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'activity_type', activity_type,
        'points_earned', points_earned,
        'created_at', created_at,
        'metadata', metadata
      ) ORDER BY created_at DESC
    ), '[]'::jsonb) as activities
    FROM (
      SELECT 
        activity_type,
        points_earned,
        created_at,
        metadata
      FROM daily_activities
      WHERE user_id = user_id_param
      ORDER BY created_at DESC
      LIMIT 10
    ) recent_acts
  )
  SELECT 
    COALESCE(us.points_total, 0),
    COALESCE(us.points_daily, 0),
    COALESCE(us.streak, 0),
    COALESCE(us.current_user, 'Unknown'),
    COALESCE(us.user_tier, 'COMMON'),
    COALESCE(ua.activities, '[]'::jsonb)
  FROM user_stats us
  CROSS JOIN user_activities ua;
END;
$$;
