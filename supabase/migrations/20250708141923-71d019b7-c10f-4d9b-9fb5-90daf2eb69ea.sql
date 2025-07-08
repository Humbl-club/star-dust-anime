-- Add first_login tracking column
ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS is_first_login boolean DEFAULT true;

-- Initialize the existing user manually step by step
INSERT INTO public.profiles (id, full_name, avatar_url)
VALUES (
  'b8efd832-d0c0-44ba-9204-aab6c7c2933b', 
  'Max H',
  'https://lh3.googleusercontent.com/a/ACg8ocLrVXAP_9yq_gqH2d7XgQc6LbQ9L4Q2Tb1Z7XkLMa8v8sN9eCk=s96-c'
)
ON CONFLICT (id) DO NOTHING;

-- Initialize points
INSERT INTO public.user_points (user_id, total_points, daily_points)
VALUES ('b8efd832-d0c0-44ba-9204-aab6c7c2933b', 0, 0)
ON CONFLICT (user_id) DO NOTHING;

-- Give starter loot box
INSERT INTO public.user_loot_boxes (user_id, box_type, quantity)
VALUES ('b8efd832-d0c0-44ba-9204-aab6c7c2933b', 'standard', 1);

-- Assign username
SELECT public.assign_random_username('b8efd832-d0c0-44ba-9204-aab6c7c2933b');

-- Process daily login
SELECT public.process_daily_login('b8efd832-d0c0-44ba-9204-aab6c7c2933b');