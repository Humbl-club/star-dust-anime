-- Add first-time loot box tracking to user_points table
ALTER TABLE user_points ADD COLUMN IF NOT EXISTS first_loot_box_opened BOOLEAN DEFAULT FALSE;

-- Add character metadata to username_pool for figurine generation
ALTER TABLE username_pool ADD COLUMN IF NOT EXISTS character_description TEXT;
ALTER TABLE username_pool ADD COLUMN IF NOT EXISTS character_personality TEXT;
ALTER TABLE username_pool ADD COLUMN IF NOT EXISTS visual_traits JSONB DEFAULT '{}';

-- Create function to check if user has opened their first loot box
CREATE OR REPLACE FUNCTION public.is_first_loot_box(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  has_opened boolean;
BEGIN
  SELECT first_loot_box_opened INTO has_opened
  FROM user_points 
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(has_opened, false);
END;
$$;

-- Create function to mark first loot box as opened
CREATE OR REPLACE FUNCTION public.mark_first_loot_box_opened(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_points 
  SET first_loot_box_opened = true 
  WHERE user_id = user_id_param;
END;
$$;