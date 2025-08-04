-- 1.3 Fix RLS Policies - Drop existing policies first
-- Remove overly permissive policies and existing ones to recreate
DROP POLICY IF EXISTS "Public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access to titles" ON public.titles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated read titles" ON public.titles;
DROP POLICY IF EXISTS "Authenticated read anime" ON public.anime_details;
DROP POLICY IF EXISTS "Authenticated read manga" ON public.manga_details;

-- Create proper granular policies
-- Content tables - authenticated users can read
CREATE POLICY "Authenticated read titles" ON public.titles 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read anime" ON public.anime_details 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read manga" ON public.manga_details 
  FOR SELECT TO authenticated USING (true);

-- User tables - users manage their own data
CREATE POLICY "Users read all profiles" ON public.profiles 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users update own profile" ON public.profiles 
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Fix user lists policies
DROP POLICY IF EXISTS "Users can create their own anime lists" ON public.user_anime_lists;
DROP POLICY IF EXISTS "Users manage own anime lists" ON public.user_anime_lists;
CREATE POLICY "Users manage own anime lists" ON public.user_anime_lists 
  FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own manga lists" ON public.user_manga_lists;
DROP POLICY IF EXISTS "Users manage own manga lists" ON public.user_manga_lists;
CREATE POLICY "Users manage own manga lists" ON public.user_manga_lists 
  FOR ALL TO authenticated USING (auth.uid() = user_id);