-- Fix database issues: Create profile for current user and fix trigger

-- Insert profile for current user (based on auth logs showing user id)
INSERT INTO public.profiles (id, full_name, username)
VALUES ('0e3806b8-22ee-40b2-8f00-c67fbda8dfcd', 'User', 'TempUser')
ON CONFLICT (id) DO NOTHING;

-- Drop and recreate the handle_new_user trigger to ensure it works properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function to be more robust
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
  
  -- Initialize user gamification data
  INSERT INTO public.user_loot_boxes (user_id, box_type, quantity)
  VALUES (NEW.id, 'standard', 1)
  ON CONFLICT (user_id, box_type) DO UPDATE SET quantity = user_loot_boxes.quantity + 1;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();