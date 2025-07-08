-- Create additional database functions for the gamification system

-- Function to add/subtract points
CREATE OR REPLACE FUNCTION add_user_points(user_id_param uuid, points_to_add integer)
RETURNS void AS $$
BEGIN
  INSERT INTO user_points (user_id, total_points, daily_points)
  VALUES (user_id_param, points_to_add, points_to_add)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + points_to_add,
    daily_points = user_points.daily_points + points_to_add,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to process daily login
CREATE OR REPLACE FUNCTION process_daily_login(user_id_param uuid)
RETURNS TABLE(points integer, streak integer) AS $$
DECLARE
  current_streak integer := 0;
  login_points integer := 10;
  streak_bonus integer := 0;
BEGIN
  -- Get current user points record
  SELECT login_streak INTO current_streak
  FROM user_points 
  WHERE user_id = user_id_param;
  
  -- If no record exists, create one
  IF current_streak IS NULL THEN
    INSERT INTO user_points (user_id, login_streak, last_login_date)
    VALUES (user_id_param, 1, CURRENT_DATE);
    current_streak := 1;
  ELSE
    -- Check if last login was yesterday
    IF (SELECT last_login_date FROM user_points WHERE user_id = user_id_param) = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Continue streak
      current_streak := current_streak + 1;
    ELSIF (SELECT last_login_date FROM user_points WHERE user_id = user_id_param) < CURRENT_DATE THEN
      -- Reset streak
      current_streak := 1;
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
  
  -- Insert daily activity
  INSERT INTO daily_activities (user_id, activity_type, points_earned)
  VALUES (user_id_param, 'login', login_points + streak_bonus);
  
  RETURN QUERY SELECT login_points + streak_bonus, current_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily points
CREATE OR REPLACE FUNCTION reset_daily_points()
RETURNS void AS $$
BEGIN
  UPDATE user_points 
  SET 
    daily_points = 0,
    last_daily_reset = CURRENT_DATE
  WHERE last_daily_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;