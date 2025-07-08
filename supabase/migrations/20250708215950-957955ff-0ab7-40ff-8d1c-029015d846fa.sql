-- Fix the SQL error in get_user_gamification_summary and improve daily login logic

-- First, fix the get_user_gamification_summary function
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
      cu.username as current_user,
      cu.tier::text as user_tier
    FROM user_points up
    LEFT JOIN claimed_usernames cu ON cu.user_id = user_id_param AND cu.is_active = true
    WHERE up.user_id = user_id_param
  ),
  user_boxes AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'box_type', box_type,
        'quantity', quantity
      )
    ) as boxes
    FROM user_loot_boxes
    WHERE user_id = user_id_param AND quantity > 0
  ),
  user_activities AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'activity_type', activity_type,
        'points_earned', points_earned,
        'created_at', created_at,
        'metadata', metadata
      ) ORDER BY created_at DESC
    ) as activities
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
    us.points_total,
    us.points_daily,
    us.streak,
    us.current_user,
    us.user_tier,
    COALESCE(ub.boxes, '[]'::jsonb),
    COALESCE(ua.activities, '[]'::jsonb)
  FROM user_stats us
  CROSS JOIN user_boxes ub
  CROSS JOIN user_activities ua;
END;
$$;

-- Improve the process_daily_login function to prevent spam
CREATE OR REPLACE FUNCTION public.process_daily_login(user_id_param uuid)
RETURNS TABLE(points integer, streak integer)
LANGUAGE plpgsql
AS $$
DECLARE
  current_streak integer := 0;
  login_points integer := 10;
  streak_bonus integer := 0;
  last_login date;
  today_login_count integer;
BEGIN
  -- Check if user already got login bonus today
  SELECT COUNT(*) INTO today_login_count
  FROM daily_activities 
  WHERE user_id = user_id_param 
    AND activity_type = 'login' 
    AND activity_date = CURRENT_DATE;
  
  -- If already got login bonus today, return current stats without awarding points
  IF today_login_count > 0 THEN
    SELECT login_streak INTO current_streak
    FROM user_points 
    WHERE user_id = user_id_param;
    
    RETURN QUERY SELECT 0 as points, COALESCE(current_streak, 0) as streak;
    RETURN;
  END IF;
  
  -- Get current user points record and last login
  SELECT login_streak, last_login_date INTO current_streak, last_login
  FROM user_points 
  WHERE user_id = user_id_param;
  
  -- If no record exists, create one
  IF current_streak IS NULL THEN
    INSERT INTO user_points (user_id, login_streak, last_login_date, total_points, daily_points)
    VALUES (user_id_param, 1, CURRENT_DATE, 0, 0);
    current_streak := 1;
  ELSE
    -- Check if last login was yesterday
    IF last_login = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Continue streak
      current_streak := current_streak + 1;
    ELSIF last_login < CURRENT_DATE THEN
      -- Reset streak
      current_streak := 1;
    ELSE
      -- Same day login (shouldn't happen due to check above, but safety net)
      RETURN QUERY SELECT 0 as points, current_streak as streak;
      RETURN;
    END IF;
    
    -- Update login data
    UPDATE user_points 
    SET 
      login_streak = current_streak,
      last_login_date = CURRENT_DATE
    WHERE user_id = user_id_param;
  END IF;
  
  -- Calculate streak bonus (every 7 days)
  streak_bonus := (current_streak / 7) * 50;
  
  -- Award login points + streak bonus
  PERFORM add_user_points(user_id_param, login_points + streak_bonus);
  
  -- Insert daily activity with today's date
  INSERT INTO daily_activities (user_id, activity_type, points_earned, activity_date)
  VALUES (user_id_param, 'login', login_points + streak_bonus, CURRENT_DATE);
  
  RETURN QUERY SELECT login_points + streak_bonus, current_streak;
END;
$$;