-- Fix user registration flow to automatically assign usernames

-- First, update the handle_new_user function to call assign_random_username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  assigned_username_result RECORD;
BEGIN
  -- Insert basic profile first (username will be updated by assign_random_username)
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Initialize gamification systems
  PERFORM public.initialize_user_gamification(NEW.id);
  
  -- Assign random username automatically
  SELECT * INTO assigned_username_result
  FROM public.assign_random_username(NEW.id);
  
  -- Process daily login bonus for new user
  PERFORM public.process_daily_login(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic user setup on registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create edge function for secure loot box opening
-- This will replace client-side randomization with server-side cryptographically secure random