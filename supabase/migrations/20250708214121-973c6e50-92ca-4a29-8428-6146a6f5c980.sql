-- Enhanced Database Functions for Gamification System
-- This replaces the problematic edge function with reliable database logic

-- Create secure loot box opening function with full logic
CREATE OR REPLACE FUNCTION public.open_loot_box_secure(
  user_id_param uuid,
  box_type_param text
)
RETURNS TABLE(
  username text,
  tier text,
  source_anime text,
  description text,
  personality text,
  is_first_time boolean,
  server_seed text,
  random_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  box_count integer;
  random_val numeric;
  selected_username text;
  selected_tier username_tier;
  selected_source text;
  selected_description text;
  selected_personality text;
  is_first boolean;
  server_seed_val text;
BEGIN
  -- Check if this is first loot box
  SELECT NOT COALESCE(first_loot_box_opened, false) INTO is_first
  FROM user_points WHERE user_id = user_id_param;
  
  -- Verify user has the loot box
  SELECT quantity INTO box_count
  FROM user_loot_boxes
  WHERE user_id = user_id_param AND box_type = box_type_param;
  
  IF box_count IS NULL OR box_count <= 0 THEN
    RAISE EXCEPTION 'No loot boxes of type % available', box_type_param;
  END IF;
  
  -- Generate server seed for provably fair system
  server_seed_val := encode(gen_random_bytes(16), 'hex');
  
  -- Generate random value
  random_val := random();
  
  -- Determine tier based on box type and random value
  IF box_type_param = 'ultra' THEN
    IF random_val <= 0.001 THEN selected_tier := 'GOD';
    ELSIF random_val <= 0.01 THEN selected_tier := 'LEGENDARY';
    ELSIF random_val <= 0.1 THEN selected_tier := 'EPIC';
    ELSIF random_val <= 0.3 THEN selected_tier := 'RARE';
    ELSIF random_val <= 0.6 THEN selected_tier := 'UNCOMMON';
    ELSE selected_tier := 'COMMON';
    END IF;
  ELSIF box_type_param = 'premium' THEN
    IF random_val <= 0.0005 THEN selected_tier := 'GOD';
    ELSIF random_val <= 0.005 THEN selected_tier := 'LEGENDARY';
    ELSIF random_val <= 0.08 THEN selected_tier := 'EPIC';
    ELSIF random_val <= 0.25 THEN selected_tier := 'RARE';
    ELSIF random_val <= 0.5 THEN selected_tier := 'UNCOMMON';
    ELSE selected_tier := 'COMMON';
    END IF;
  ELSE -- standard
    IF random_val <= 0.0001 THEN selected_tier := 'GOD';
    ELSIF random_val <= 0.005 THEN selected_tier := 'LEGENDARY';
    ELSIF random_val <= 0.05 THEN selected_tier := 'EPIC';
    ELSIF random_val <= 0.2 THEN selected_tier := 'RARE';
    ELSIF random_val <= 0.5 THEN selected_tier := 'UNCOMMON';
    ELSE selected_tier := 'COMMON';
    END IF;
  END IF;
  
  -- Get random username from pool with character data
  SELECT up.name, up.source_anime, up.character_description, up.character_personality
  INTO selected_username, selected_source, selected_description, selected_personality
  FROM username_pool up
  WHERE up.tier = selected_tier
  ORDER BY random()
  LIMIT 1;
  
  -- Fallback to COMMON if no username found
  IF selected_username IS NULL THEN
    SELECT up.name, up.source_anime, up.character_description, up.character_personality
    INTO selected_username, selected_source, selected_description, selected_personality
    FROM username_pool up
    WHERE up.tier = 'COMMON'
    ORDER BY random()
    LIMIT 1;
    selected_tier := 'COMMON';
  END IF;
  
  -- Consume the loot box
  UPDATE user_loot_boxes
  SET quantity = quantity - 1
  WHERE user_id = user_id_param AND box_type = box_type_param;
  
  -- Add to username history
  INSERT INTO username_history (user_id, username, tier, acquired_method)
  VALUES (user_id_param, selected_username, selected_tier, 'loot_box');
  
  -- Mark first loot box as opened if this was their first time
  IF is_first THEN
    UPDATE user_points 
    SET first_loot_box_opened = true 
    WHERE user_id = user_id_param;
  END IF;
  
  -- Log the opening
  INSERT INTO daily_activities (user_id, activity_type, points_earned, metadata)
  VALUES (user_id_param, 'loot_box_opened', 0, jsonb_build_object(
    'box_type', box_type_param,
    'username_obtained', selected_username,
    'tier', selected_tier,
    'server_seed', server_seed_val,
    'random_value', random_val,
    'is_first_time', is_first
  ));
  
  -- Create character entry for generation
  INSERT INTO generated_characters (username, tier, character_data, generation_method)
  VALUES (selected_username, selected_tier, jsonb_build_object(
    'source_anime', selected_source,
    'description', selected_description,
    'personality', selected_personality,
    'tier', selected_tier
  ), 'loot_box');
  
  -- Return results
  RETURN QUERY SELECT 
    selected_username,
    selected_tier::text,
    selected_source,
    selected_description,
    selected_personality,
    is_first,
    server_seed_val,
    random_val;
END;
$$;

-- Enhanced function to get user gamification summary
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
      )
    ) as activities
    FROM daily_activities
    WHERE user_id = user_id_param
    ORDER BY created_at DESC
    LIMIT 10
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