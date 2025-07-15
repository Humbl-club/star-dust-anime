-- Final comprehensive cleanup and fix for user authentication system
-- This migration addresses the 500 error during signup and cleans up obsolete code

-- Ensure initialize_user_gamification function exists (should already exist from previous migrations)
CREATE OR REPLACE FUNCTION public.initialize_user_gamification(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create points record
  INSERT INTO public.user_points (user_id, total_points, daily_points)
  VALUES (user_id_param, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Give starter loot box
  INSERT INTO public.user_loot_boxes (user_id, box_type, quantity)
  VALUES (user_id_param, 'standard', 1)
  ON CONFLICT (user_id, box_type) DO UPDATE SET quantity = user_loot_boxes.quantity + 1;
END;
$$;

-- Clean up obsolete functions that are no longer needed
DROP FUNCTION IF EXISTS public.handle_new_user_simple() CASCADE;
DROP FUNCTION IF EXISTS public.process_daily_login(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.notify_auth_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.log_auth_event() CASCADE;

-- Remove any conflicting triggers
DROP TRIGGER IF EXISTS notify_auth_webhook ON auth.users;
DROP TRIGGER IF EXISTS log_auth_event ON auth.users;

-- Ensure our main trigger exists and is the only one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();