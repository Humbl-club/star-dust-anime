-- Execute repair function for all existing users and fix gamification issues

-- First, ensure the repair function exists and works properly
CREATE OR REPLACE FUNCTION public.repair_user_gamification(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_has_username boolean := false;
  user_has_points boolean := false;
  user_has_starter_box boolean := false;
BEGIN
  -- Check if user has active username
  SELECT EXISTS(
    SELECT 1 FROM claimed_usernames 
    WHERE user_id = user_id_param AND is_active = true
  ) INTO user_has_username;
  
  -- Check if user has points record
  SELECT EXISTS(
    SELECT 1 FROM user_points 
    WHERE user_id = user_id_param
  ) INTO user_has_points;
  
  -- Check if user has any loot boxes
  SELECT EXISTS(
    SELECT 1 FROM user_loot_boxes 
    WHERE user_id = user_id_param AND quantity > 0
  ) INTO user_has_starter_box;
  
  -- Initialize points if missing
  IF NOT user_has_points THEN
    INSERT INTO user_points (user_id, total_points, daily_points)
    VALUES (user_id_param, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Assign username if missing
  IF NOT user_has_username THEN
    PERFORM assign_random_username(user_id_param);
  END IF;
  
  -- Give starter loot box if missing
  IF NOT user_has_starter_box THEN
    INSERT INTO user_loot_boxes (user_id, box_type, quantity)
    VALUES (user_id_param, 'standard', 1)
    ON CONFLICT (user_id, box_type) 
    DO UPDATE SET quantity = user_loot_boxes.quantity + 1;
  END IF;
END;
$$;

-- Fix the gamification summary function to return default values instead of NULL
CREATE OR REPLACE FUNCTION public.get_user_gamification_summary(user_id_param uuid)
RETURNS TABLE(
  total_points integer,
  daily_points integer,
  login_streak integer,
  current_username text,
  username_tier text,
  loot_boxes jsonb,
  recent_activities jsonb
)
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
    COALESCE(ub.boxes, '[]'::jsonb),
    COALESCE(ua.activities, '[]'::jsonb)
  FROM user_stats us
  CROSS JOIN user_boxes ub
  CROSS JOIN user_activities ua;
END;
$$;

-- Now run the repair function for ALL existing users
DO $$
DECLARE
  user_record RECORD;
  repair_count integer := 0;
BEGIN
  -- Get all users from auth.users and repair their gamification data
  FOR user_record IN 
    SELECT id FROM auth.users
  LOOP
    BEGIN
      PERFORM repair_user_gamification(user_record.id);
      repair_count := repair_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but continue with other users
        RAISE WARNING 'Failed to repair user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Successfully repaired % users', repair_count;
END $$;