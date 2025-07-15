-- Fix the user creation trigger to properly initialize new users
-- Update the trigger to call the proper user initialization function

-- Recreate the proper user initialization trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();