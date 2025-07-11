-- Now restore the full trigger with all missing tables created
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;

-- Restore the complete handle_new_user function 
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert basic profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Initialize user points
  INSERT INTO public.user_points (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize gamification systems  
  INSERT INTO public.user_loot_boxes (user_id, box_type, quantity)
  VALUES (NEW.id, 'standard', 1)
  ON CONFLICT (user_id, box_type) DO UPDATE SET quantity = user_loot_boxes.quantity + 1;
  
  -- Assign random username automatically
  PERFORM public.assign_random_username(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create the complete trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();