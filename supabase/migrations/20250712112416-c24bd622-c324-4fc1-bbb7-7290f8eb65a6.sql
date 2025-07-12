-- Phase 2: Security Hardening - Fix RLS Policies
-- Replace overly permissive "public" role policies with proper "service_role" policies

-- Fix profiles table policies - remove public access, keep user access
DROP POLICY IF EXISTS "Public read access to profiles" ON public.profiles;

-- Fix content tables - replace public with service_role where appropriate
DROP POLICY IF EXISTS "Public read access to anime_details" ON public.anime_details;
DROP POLICY IF EXISTS "Public read access to manga_details" ON public.manga_details;
DROP POLICY IF EXISTS "Public read access to titles" ON public.titles;
DROP POLICY IF EXISTS "Public read access to genres" ON public.genres;
DROP POLICY IF EXISTS "Public read access to studios" ON public.studios;
DROP POLICY IF EXISTS "Public read access to authors" ON public.authors;

-- Create proper granular policies instead of "ALL" permissions
-- Content tables - allow authenticated users to read
CREATE POLICY "Authenticated read anime_details" ON public.anime_details 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read manga_details" ON public.manga_details 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read titles" ON public.titles 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read genres" ON public.genres 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read studios" ON public.studios 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read authors" ON public.authors 
FOR SELECT TO authenticated USING (true);

-- Profile policies - users can read all profiles but only update their own
CREATE POLICY "Authenticated read profiles" ON public.profiles 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users update own profile" ON public.profiles 
FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.profiles 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);