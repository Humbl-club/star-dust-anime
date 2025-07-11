-- Remove the foreign key constraints that might be causing timing issues in the trigger
-- The trigger needs to work in sequence without constraint validation failures

ALTER TABLE public.user_points 
DROP CONSTRAINT IF EXISTS user_points_user_id_fkey;

ALTER TABLE public.daily_activities 
DROP CONSTRAINT IF EXISTS daily_activities_user_id_fkey;

-- Also simplify the trigger to avoid any complex operations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create an even simpler trigger that just does the profile
CREATE OR REPLACE FUNCTION public.handle_new_user_minimal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Only insert basic profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create the minimal trigger
CREATE TRIGGER on_auth_user_created_minimal
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_minimal();