-- Fix the initialize_user_gamification function
CREATE OR REPLACE FUNCTION public.initialize_user_gamification(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Create points record
  INSERT INTO public.user_points (user_id, total_points, daily_points)
  VALUES (user_id_param, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Give starter loot box
  INSERT INTO public.user_loot_boxes (user_id, box_type, quantity)
  VALUES (user_id_param, 'standard', 1)
  ON CONFLICT (user_id, box_type) DO UPDATE SET quantity = public.user_loot_boxes.quantity + 1;
END;
$$;

-- Initialize the existing user manually
INSERT INTO public.profiles (id, full_name, avatar_url)
VALUES (
  'b8efd832-d0c0-44ba-9204-aab6c7c2933b', 
  'Max H',
  'https://lh3.googleusercontent.com/a/ACg8ocLrVXAP_9yq_gqH2d7XgQc6LbQ9L4Q2Tb1Z7XkLMa8v8sN9eCk=s96-c'
)
ON CONFLICT (id) DO NOTHING;

-- Initialize gamification for existing user
SELECT public.initialize_user_gamification('b8efd832-d0c0-44ba-9204-aab6c7c2933b');

-- Assign username
SELECT public.assign_random_username('b8efd832-d0c0-44ba-9204-aab6c7c2933b');

-- Process daily login
SELECT public.process_daily_login('b8efd832-d0c0-44ba-9204-aab6c7c2933b');