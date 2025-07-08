-- Fix user initialization issues and add data repair for existing users

-- First, fix the loot box purchase upsert logic by updating the constraint
DROP INDEX IF EXISTS user_loot_boxes_user_id_box_type_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_loot_boxes_user_id_box_type_key ON user_loot_boxes(user_id, box_type);

-- Create a function to repair existing users who don't have proper initialization
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

-- Repair all existing users without proper initialization
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT u.id 
    FROM auth.users u
    LEFT JOIN claimed_usernames cu ON u.id = cu.user_id AND cu.is_active = true
    LEFT JOIN user_points up ON u.id = up.user_id
    LEFT JOIN user_loot_boxes ulb ON u.id = ulb.user_id AND ulb.quantity > 0
    WHERE cu.id IS NULL OR up.id IS NULL OR ulb.id IS NULL
  LOOP
    PERFORM repair_user_gamification(user_record.id);
  END LOOP;
END $$;