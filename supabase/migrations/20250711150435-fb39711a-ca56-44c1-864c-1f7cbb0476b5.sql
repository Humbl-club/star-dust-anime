-- Completely disable ALL custom triggers to isolate the signup issue
DROP TRIGGER IF EXISTS on_auth_user_created_minimal ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_minimal();

-- Let's see if basic signup works without ANY triggers first