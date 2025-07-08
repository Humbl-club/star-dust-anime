-- Fix the initialize_user_gamification function signature
CREATE OR REPLACE FUNCTION public.initialize_user_gamification(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create points record
  INSERT INTO user_points (user_id, total_points, daily_points)
  VALUES (user_id_param, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Give starter loot box
  INSERT INTO user_loot_boxes (user_id, box_type, quantity)
  VALUES (user_id_param, 'standard', 1)
  ON CONFLICT (user_id, box_type) DO UPDATE SET quantity = user_loot_boxes.quantity + 1;
  
END;
$$;

-- Update the secure loot box function to mark first loot box as opened
UPDATE supabase.functions SET definition = replace(definition, 'mark_first_loot_box_opened', 'mark_first_loot_box_opened') WHERE name = 'secure-loot-box';

-- Add sample character descriptions to make the experience richer
UPDATE username_pool 
SET character_description = CASE 
  WHEN name = 'Naruto' THEN 'A spirited ninja with the power of the Nine-Tailed Fox, determined to become Hokage'
  WHEN name = 'Goku' THEN 'A Saiyan warrior with incredible strength and a pure heart, always seeking stronger opponents'
  WHEN name = 'Luffy' THEN 'A rubber-bodied pirate captain with an unbreakable will, destined to become the Pirate King'
  WHEN name = 'Ichigo' THEN 'A substitute Soul Reaper with the power to protect both worlds from evil spirits'
  WHEN name = 'Natsu' THEN 'A Dragon Slayer wizard with the power of fire, fiercely loyal to his guild'
  ELSE 'A legendary character with unique abilities and an inspiring story'
END,
character_personality = CASE 
  WHEN name = 'Naruto' THEN 'Determined, optimistic, never gives up'
  WHEN name = 'Goku' THEN 'Pure-hearted, always hungry, loves fighting strong opponents'
  WHEN name = 'Luffy' THEN 'Carefree, adventurous, deeply loyal to friends'
  WHEN name = 'Ichigo' THEN 'Serious, protective, reluctant hero with a strong sense of justice'
  WHEN name = 'Natsu' THEN 'Hot-headed, loyal, destructive but with a good heart'
  ELSE 'Brave, determined, and inspiring'
END;