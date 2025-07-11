-- Fix the assign_random_username function as well to avoid ambiguous column references

CREATE OR REPLACE FUNCTION public.assign_random_username(user_id_param uuid)
RETURNS TABLE(username text, tier username_tier)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  random_val float;
  selected_username text;
  selected_tier username_tier;
  tier_order username_tier[] := ARRAY['GOD', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];
  i integer;
BEGIN
  -- Generate random value for tier selection
  random_val := random();
  
  -- Determine initial tier based on probability
  IF random_val <= 0.0001 THEN -- 0.01% chance for GOD
    selected_tier := 'GOD';
  ELSIF random_val <= 0.005 THEN -- 0.5% chance for LEGENDARY
    selected_tier := 'LEGENDARY';
  ELSIF random_val <= 0.05 THEN -- 5% chance for EPIC
    selected_tier := 'EPIC';
  ELSIF random_val <= 0.2 THEN -- 15% chance for RARE
    selected_tier := 'RARE';
  ELSIF random_val <= 0.5 THEN -- 30% chance for UNCOMMON
    selected_tier := 'UNCOMMON';
  ELSE -- 49.49% chance for COMMON
    selected_tier := 'COMMON';
  END IF;
  
  -- Try to get username from selected tier, with fallback to other tiers
  FOR i IN array_lower(tier_order, 1)..array_upper(tier_order, 1) LOOP
    -- Start with selected tier, then try others in order
    IF i = 1 THEN
      -- First attempt: use the randomly selected tier
    ELSE
      -- Fallback: try tiers in order
      selected_tier := tier_order[i];
    END IF;
    
    -- Try to find available username in current tier
    SELECT up.name INTO selected_username
    FROM username_pool up
    WHERE up.tier = selected_tier
    AND up.name NOT IN (SELECT cu.username FROM claimed_usernames cu WHERE cu.is_active = true)
    ORDER BY random()
    LIMIT 1;
    
    -- If we found a username, break out of loop
    IF selected_username IS NOT NULL THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- If still no username found after trying all tiers, raise error
  IF selected_username IS NULL THEN
    RAISE EXCEPTION 'No available usernames in any tier. Username pool exhausted.';
  END IF;
  
  -- Claim the username
  INSERT INTO claimed_usernames (username, user_id, tier)
  VALUES (selected_username, user_id_param, selected_tier);
  
  -- Update profile with username
  UPDATE profiles SET username = selected_username WHERE id = user_id_param;
  
  RETURN QUERY SELECT selected_username as username_val, selected_tier as tier_val;
END;
$$;