-- Fix the user_loot_boxes table to support ON CONFLICT in handle_new_user trigger
-- Add unique constraint and make user_id NOT NULL for proper RLS

-- First, make user_id NOT NULL since it's required for RLS
ALTER TABLE public.user_loot_boxes 
ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint on (user_id, box_type) to support ON CONFLICT
ALTER TABLE public.user_loot_boxes 
ADD CONSTRAINT user_loot_boxes_user_id_box_type_key UNIQUE (user_id, box_type);