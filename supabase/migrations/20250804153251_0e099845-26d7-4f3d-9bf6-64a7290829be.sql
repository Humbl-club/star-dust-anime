-- 1.3 Fix RLS Policies
-- Remove overly permissive policies
DROP POLICY IF EXISTS "Public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access to titles" ON public.titles;

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

-- Fix user lists policies (using user_title_lists table that exists)
DROP POLICY IF EXISTS "Users can create their own anime lists" ON public.user_title_lists;
DROP POLICY IF EXISTS "Users can create their own manga lists" ON public.user_title_lists;
CREATE POLICY "Users manage own title lists" ON public.user_title_lists 
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 1.4 Add Missing Database Indexes
-- Performance critical indexes
CREATE INDEX IF NOT EXISTS idx_titles_content_type_score 
  ON titles(score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_user_title_lists_composite 
  ON user_title_lists(user_id, status_id, updated_at DESC);

-- Email tracking indexes
CREATE INDEX IF NOT EXISTS idx_email_verification_user_email 
  ON email_verification_status(user_id, email);

CREATE INDEX IF NOT EXISTS idx_email_delivery_tracking_composite 
  ON email_delivery_tracking(user_id, email_type, created_at DESC);