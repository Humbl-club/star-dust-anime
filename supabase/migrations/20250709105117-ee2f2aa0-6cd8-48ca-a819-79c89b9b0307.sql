-- Phase 1: Complete Backend Database Cleanup
-- Remove all unused character, animation, and gamification tables and functions

-- Drop unused character-related tables
DROP TABLE IF EXISTS character_enhancements CASCADE;
DROP TABLE IF EXISTS character_interactions CASCADE;
DROP TABLE IF EXISTS character_showcase_likes CASCADE;
DROP TABLE IF EXISTS character_showcases CASCADE;
DROP TABLE IF EXISTS character_templates CASCADE;
DROP TABLE IF EXISTS character_variations CASCADE;
DROP TABLE IF EXISTS character_trade_listings CASCADE;

-- Drop unused animation and generated character tables
DROP TABLE IF EXISTS animation_sets CASCADE;
DROP TABLE IF EXISTS generated_characters CASCADE;

-- Drop unused trading and achievement tables
DROP TABLE IF EXISTS username_trades CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;

-- Drop cleanup audit and other unused tables
DROP TABLE IF EXISTS cleanup_audit_log CASCADE;
DROP TABLE IF EXISTS phase_1_cleanup_summary CASCADE;

-- Remove unused functions
DROP FUNCTION IF EXISTS public.cleanup_expired_generated_characters() CASCADE;
DROP FUNCTION IF EXISTS public.initialize_user_gamification(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.repair_user_gamification(uuid) CASCADE;

-- Update initialize_user_atomic function to include welcome animation failsafe logic
CREATE OR REPLACE FUNCTION public.initialize_user_atomic(user_id_param uuid)
RETURNS TABLE(
  success boolean,
  username text,
  tier text,
  total_points integer,
  is_first_time boolean,
  needs_welcome boolean,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean := false;
  has_username boolean := false;
  assigned_username_result RECORD;
  is_new_user boolean := true;
  should_show_welcome boolean := false;
BEGIN
  -- Check if user already has points record
  SELECT EXISTS(
    SELECT 1 FROM user_points WHERE user_id = user_id_param
  ) INTO user_exists;
  
  -- Check if user has an active username
  SELECT EXISTS(
    SELECT 1 FROM claimed_usernames 
    WHERE user_id = user_id_param AND is_active = true
  ) INTO has_username;
  
  -- Determine if user needs welcome animation (new user OR missing username)
  should_show_welcome := NOT user_exists OR NOT has_username;
  
  IF user_exists AND has_username THEN
    -- User already fully initialized, just return current data
    SELECT 
      true,
      cu.username,
      cu.tier::text,
      up.total_points,
      false,
      false,
      'User already initialized'
    INTO success, username, tier, total_points, is_first_time, needs_welcome, message
    FROM user_points up
    LEFT JOIN claimed_usernames cu ON cu.user_id = user_id_param AND cu.is_active = true
    WHERE up.user_id = user_id_param;
    
    RETURN QUERY SELECT success, username, tier, total_points, is_first_time, needs_welcome, message;
    RETURN;
  END IF;
  
  -- Initialize or repair user account atomically
  BEGIN
    -- 1. Initialize points if missing
    IF NOT user_exists THEN
      INSERT INTO user_points (user_id, total_points, daily_points, login_streak)
      VALUES (user_id_param, 100, 0, 0); -- Give 100 starting points
    END IF;
    
    -- 2. Assign username if missing
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
    
    -- 3. Record activity for new users only
    IF NOT user_exists THEN
      INSERT INTO daily_activities (user_id, activity_type, points_earned, metadata)
      VALUES (user_id_param, 'signup_bonus', 100, jsonb_build_object(
        'username_assigned', assigned_username_result.username,
        'tier', assigned_username_result.tier,
        'signup_date', now()
      ));
    END IF;
    
    RETURN QUERY SELECT 
      true,
      assigned_username_result.username,
      assigned_username_result.tier::text,
      CASE WHEN user_exists THEN (SELECT total_points FROM user_points WHERE user_id = user_id_param) ELSE 100 END,
      NOT user_exists, -- is_first_time
      should_show_welcome, -- needs_welcome
      CASE WHEN user_exists THEN 'User account repaired' ELSE 'User initialized successfully' END;
      
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        false,
        'Error'::text,
        'COMMON'::text,
        0,
        false,
        false,
        SQLERRM;
  END;
END;
$$;