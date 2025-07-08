-- Add first_login tracking to user_points table
ALTER TABLE user_points ADD COLUMN IF NOT EXISTS is_first_login boolean DEFAULT true;

-- Create manual user initialization function for existing users
CREATE OR REPLACE FUNCTION public.handle_new_user_manual(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  assigned_username_result RECORD;
  user_data RECORD;
BEGIN
  -- Get user data
  SELECT raw_user_meta_data INTO user_data FROM auth.users WHERE id = user_id_param;
  
  -- Insert basic profile first (username will be updated by assign_random_username)
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    user_id_param, 
    user_data.raw_user_meta_data->>'full_name',
    user_data.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Initialize gamification systems
  INSERT INTO public.user_points (user_id, total_points, daily_points)
  VALUES (user_id_param, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Give starter loot box
  INSERT INTO public.user_loot_boxes (user_id, box_type, quantity)
  VALUES (user_id_param, 'standard', 1)
  ON CONFLICT (user_id, box_type) DO UPDATE SET quantity = user_loot_boxes.quantity + 1;
  
  -- Assign random username automatically
  SELECT * INTO assigned_username_result
  FROM public.assign_random_username(user_id_param);
  
  -- Process daily login bonus for new user
  PERFORM public.process_daily_login(user_id_param);
END;
$$;

-- Initialize existing user who missed the setup
SELECT public.handle_new_user_manual('b8efd832-d0c0-44ba-9204-aab6c7c2933b');