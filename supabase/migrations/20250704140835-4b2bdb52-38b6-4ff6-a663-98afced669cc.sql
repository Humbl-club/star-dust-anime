-- ====================================================================
-- COMPLETE DATABASE RESET AND OPTIMIZED REBUILD
-- ====================================================================

-- Drop all existing tables, views, functions in correct order to avoid dependency issues
DROP VIEW IF EXISTS public.anime_stats CASCADE;
DROP VIEW IF EXISTS public.manga_stats CASCADE;
DROP VIEW IF EXISTS public.user_activity_stats CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.cron_job_logs CASCADE;
DROP TABLE IF EXISTS public.sync_logs CASCADE;
DROP TABLE IF EXISTS public.content_sync_status CASCADE;
DROP TABLE IF EXISTS public.api_attributions CASCADE;
DROP TABLE IF EXISTS public.legal_pages CASCADE;
DROP TABLE IF EXISTS public.content_reports CASCADE;
DROP TABLE IF EXISTS public.activity_feed CASCADE;
DROP TABLE IF EXISTS public.user_follows CASCADE;
DROP TABLE IF EXISTS public.review_reactions CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.user_manga_lists CASCADE;
DROP TABLE IF EXISTS public.user_anime_lists CASCADE;
DROP TABLE IF EXISTS public.user_content_preferences CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.manga CASCADE;
DROP TABLE IF EXISTS public.anime CASCADE;
DROP TABLE IF EXISTS public.recommendations CASCADE;
DROP TABLE IF EXISTS public.import_export_logs CASCADE;
DROP TABLE IF EXISTS public.curated_list_items CASCADE;
DROP TABLE IF EXISTS public.curated_lists CASCADE;
DROP TABLE IF EXISTS public.list_follows CASCADE;
DROP TABLE IF EXISTS public.influencer_follows CASCADE;
DROP TABLE IF EXISTS public.video_content CASCADE;
DROP TABLE IF EXISTS public.influencers CASCADE;
DROP TABLE IF EXISTS public.anime_detailed_stats CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.feed_posts CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.challenge_participants CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;
DROP TABLE IF EXISTS public.activity_data CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.delete_expired_posts() CASCADE;

-- Remove cron jobs
SELECT cron.unschedule('daily-incremental-sync');
SELECT cron.unschedule('weekly-anilist-enhancement');
SELECT cron.unschedule('intelligent-content-sync-6h');

-- ====================================================================
-- REBUILD OPTIMIZED DATABASE SCHEMA
-- ====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- CORE CONTENT TABLES
-- ====================================================================

-- Anime table with optimized structure
CREATE TABLE public.anime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mal_id INTEGER UNIQUE,
  anilist_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  title_english TEXT,
  title_japanese TEXT,
  synopsis TEXT,
  type TEXT DEFAULT 'TV' CHECK (type IN ('TV', 'Movie', 'OVA', 'Special', 'ONA', 'Music')),
  episodes INTEGER CHECK (episodes > 0),
  status TEXT DEFAULT 'Finished Airing' CHECK (status IN ('Currently Airing', 'Finished Airing', 'Not yet aired', 'Cancelled')),
  aired_from DATE,
  aired_to DATE,
  season TEXT CHECK (season IN ('Winter', 'Spring', 'Summer', 'Fall')),
  year INTEGER CHECK (year > 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 5),
  score DECIMAL(4,2) CHECK (score >= 0 AND score <= 10),
  scored_by INTEGER CHECK (scored_by >= 0),
  rank INTEGER CHECK (rank > 0),
  popularity INTEGER CHECK (popularity > 0),
  members INTEGER CHECK (members >= 0),
  favorites INTEGER CHECK (favorites >= 0),
  image_url TEXT,
  trailer_url TEXT,
  trailer_id TEXT,
  trailer_site TEXT,
  genres TEXT[] DEFAULT '{}',
  studios TEXT[] DEFAULT '{}',
  themes TEXT[] DEFAULT '{}',
  demographics TEXT[] DEFAULT '{}',
  -- AniList enhanced fields
  anilist_score DECIMAL(4,2) CHECK (anilist_score >= 0 AND anilist_score <= 10),
  banner_image TEXT,
  cover_image_large TEXT,
  cover_image_extra_large TEXT,
  color_theme TEXT,
  characters_data JSONB DEFAULT '[]',
  staff_data JSONB DEFAULT '[]',
  external_links JSONB DEFAULT '[]',
  streaming_episodes JSONB DEFAULT '[]',
  detailed_tags JSONB DEFAULT '[]',
  relations_data JSONB DEFAULT '[]',
  recommendations_data JSONB DEFAULT '[]',
  studios_data JSONB DEFAULT '[]',
  -- Scheduling fields
  next_episode_date TIMESTAMPTZ,
  next_episode_number INTEGER CHECK (next_episode_number > 0),
  airing_schedule JSONB DEFAULT '[]',
  last_sync_check TIMESTAMPTZ DEFAULT now(),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Manga table with optimized structure
CREATE TABLE public.manga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mal_id INTEGER,
  anilist_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  title_english TEXT,
  title_japanese TEXT,
  synopsis TEXT,
  type TEXT DEFAULT 'Manga' CHECK (type IN ('Manga', 'Novel', 'Light Novel', 'One-shot', 'Doujinshi', 'Manhwa', 'Manhua')),
  chapters INTEGER CHECK (chapters >= 0),
  volumes INTEGER CHECK (volumes >= 0),
  status TEXT DEFAULT 'Finished' CHECK (status IN ('Publishing', 'Finished', 'On Hiatus', 'Discontinued', 'Not yet published')),
  published_from DATE,
  published_to DATE,
  score DECIMAL(4,2) CHECK (score >= 0 AND score <= 10),
  scored_by INTEGER CHECK (scored_by >= 0),
  rank INTEGER CHECK (rank > 0),
  popularity INTEGER CHECK (popularity > 0),
  members INTEGER CHECK (members >= 0),
  favorites INTEGER CHECK (favorites >= 0),
  image_url TEXT,
  genres TEXT[] DEFAULT '{}',
  authors TEXT[] DEFAULT '{}',
  serializations TEXT[] DEFAULT '{}',
  themes TEXT[] DEFAULT '{}',
  demographics TEXT[] DEFAULT '{}',
  -- Scheduling fields
  next_chapter_date TIMESTAMPTZ,
  next_chapter_number INTEGER CHECK (next_chapter_number > 0),
  release_schedule JSONB DEFAULT '[]',
  last_sync_check TIMESTAMPTZ DEFAULT now(),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- USER MANAGEMENT TABLES
-- ====================================================================

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  birth_date DATE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User preferences
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('private', 'friends', 'public')),
  show_adult_content BOOLEAN DEFAULT false,
  preferred_genres TEXT[] DEFAULT '{}',
  excluded_genres TEXT[] DEFAULT '{}',
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "reviews": true, "follows": true}',
  list_visibility TEXT DEFAULT 'public' CHECK (list_visibility IN ('private', 'friends', 'public')),
  auto_add_sequels BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User content preferences for age verification
CREATE TABLE public.user_content_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  age_verified BOOLEAN DEFAULT false,
  age_verification_date TIMESTAMPTZ,
  show_adult_content BOOLEAN DEFAULT false,
  content_rating_preference TEXT DEFAULT 'teen' CHECK (content_rating_preference IN ('all', 'teen', 'mature', 'adult')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- USER LIST TABLES
-- ====================================================================

-- User anime lists
CREATE TABLE public.user_anime_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'plan_to_watch' CHECK (status IN ('watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch')),
  score INTEGER CHECK (score >= 1 AND score <= 10),
  episodes_watched INTEGER DEFAULT 0 CHECK (episodes_watched >= 0),
  start_date DATE,
  finish_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

-- User manga lists
CREATE TABLE public.user_manga_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id UUID REFERENCES public.manga(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'plan_to_read' CHECK (status IN ('reading', 'completed', 'on_hold', 'dropped', 'plan_to_read')),
  score INTEGER CHECK (score >= 1 AND score <= 10),
  chapters_read INTEGER DEFAULT 0 CHECK (chapters_read >= 0),
  volumes_read INTEGER DEFAULT 0 CHECK (volumes_read >= 0),
  start_date DATE,
  finish_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

-- ====================================================================
-- SOCIAL FEATURES
-- ====================================================================

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE,
  manga_id UUID REFERENCES public.manga(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  title TEXT,
  content TEXT NOT NULL,
  spoiler_warning BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK ((anime_id IS NOT NULL AND manga_id IS NULL) OR (anime_id IS NULL AND manga_id IS NOT NULL)),
  UNIQUE (user_id, anime_id, manga_id)
);

-- Review reactions
CREATE TABLE public.review_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('helpful', 'unhelpful', 'love', 'funny')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id, reaction_type)
);

-- User follows
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Activity feed
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('added_to_list', 'completed', 'rated', 'reviewed', 'started_watching', 'started_reading')),
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE,
  manga_id UUID REFERENCES public.manga(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK ((anime_id IS NOT NULL AND manga_id IS NULL) OR (anime_id IS NULL AND manga_id IS NOT NULL))
);

-- ====================================================================
-- CONTENT MODERATION & LEGAL
-- ====================================================================

-- Content reports
CREATE TABLE public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_content_type TEXT CHECK (reported_content_type IN ('anime', 'manga', 'review', 'post', 'comment', 'user')),
  reported_content_id UUID NOT NULL,
  report_reason TEXT CHECK (report_reason IN ('inappropriate_content', 'copyright_violation', 'spam', 'harassment', 'misinformation', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- API attributions for legal compliance
CREATE TABLE public.api_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  attribution_text TEXT NOT NULL,
  license_url TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Legal pages
CREATE TABLE public.legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT UNIQUE CHECK (page_type IN ('privacy_policy', 'terms_of_service', 'content_policy', 'copyright_policy')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  effective_date TIMESTAMPTZ DEFAULT now(),
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- SYNC & OPERATIONS TABLES
-- ====================================================================

-- Content sync status tracking
CREATE TABLE public.content_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT CHECK (content_type IN ('anime', 'manga')),
  operation_type TEXT CHECK (operation_type IN ('full_sync', 'schedule_update', 'next_episode_check', 'incremental_sync')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_items INTEGER DEFAULT 0 CHECK (total_items >= 0),
  processed_items INTEGER DEFAULT 0 CHECK (processed_items >= 0),
  current_page INTEGER DEFAULT 1 CHECK (current_page > 0),
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ
);

-- Sync logs for detailed tracking
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT CHECK (content_type IN ('anime', 'manga')),
  operation_type TEXT CHECK (operation_type IN ('fetch_data', 'sync_images', 'enhance_data')),
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed')),
  items_processed INTEGER DEFAULT 0 CHECK (items_processed >= 0),
  page INTEGER DEFAULT 1 CHECK (page > 0),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Cron job execution logs
CREATE TABLE public.cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  executed_at TIMESTAMPTZ DEFAULT now(),
  details JSONB,
  error_message TEXT
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================

-- Anime indexes
CREATE INDEX idx_anime_title_search ON public.anime USING gin(to_tsvector('english', title));
CREATE INDEX idx_anime_mal_id ON public.anime(mal_id) WHERE mal_id IS NOT NULL;
CREATE INDEX idx_anime_anilist_id ON public.anime(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX idx_anime_score_desc ON public.anime(score DESC NULLS LAST);
CREATE INDEX idx_anime_popularity_desc ON public.anime(popularity DESC NULLS LAST);
CREATE INDEX idx_anime_year_desc ON public.anime(year DESC NULLS LAST);
CREATE INDEX idx_anime_status ON public.anime(status);
CREATE INDEX idx_anime_type ON public.anime(type);
CREATE INDEX idx_anime_genres ON public.anime USING gin(genres);
CREATE INDEX idx_anime_next_episode ON public.anime(next_episode_date) WHERE next_episode_date IS NOT NULL;
CREATE INDEX idx_anime_updated_at ON public.anime(updated_at DESC);

-- Manga indexes
CREATE INDEX idx_manga_title_search ON public.manga USING gin(to_tsvector('english', title));
CREATE INDEX idx_manga_mal_id ON public.manga(mal_id) WHERE mal_id IS NOT NULL;
CREATE INDEX idx_manga_anilist_id ON public.manga(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX idx_manga_score_desc ON public.manga(score DESC NULLS LAST);
CREATE INDEX idx_manga_popularity_desc ON public.manga(popularity DESC NULLS LAST);
CREATE INDEX idx_manga_status ON public.manga(status);
CREATE INDEX idx_manga_type ON public.manga(type);
CREATE INDEX idx_manga_genres ON public.manga USING gin(genres);
CREATE INDEX idx_manga_updated_at ON public.manga(updated_at DESC);

-- User list indexes
CREATE INDEX idx_user_anime_lists_user_status ON public.user_anime_lists(user_id, status);
CREATE INDEX idx_user_anime_lists_anime ON public.user_anime_lists(anime_id);
CREATE INDEX idx_user_manga_lists_user_status ON public.user_manga_lists(user_id, status);
CREATE INDEX idx_user_manga_lists_manga ON public.user_manga_lists(manga_id);

-- Social indexes
CREATE INDEX idx_reviews_anime_created ON public.reviews(anime_id, created_at DESC);
CREATE INDEX idx_reviews_manga_created ON public.reviews(manga_id, created_at DESC);
CREATE INDEX idx_reviews_user_created ON public.reviews(user_id, created_at DESC);
CREATE INDEX idx_review_reactions_review ON public.review_reactions(review_id);
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_activity_feed_user_created ON public.activity_feed(user_id, created_at DESC);

-- Sync indexes
CREATE INDEX idx_content_sync_status_type_status ON public.content_sync_status(content_type, status);
CREATE INDEX idx_sync_logs_type_created ON public.sync_logs(content_type, created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_anime_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_manga_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Public content policies (anime/manga)
CREATE POLICY "Public read access to anime" ON public.anime FOR SELECT USING (true);
CREATE POLICY "Public read access to manga" ON public.manga FOR SELECT USING (true);
CREATE POLICY "Service role full access to anime" ON public.anime FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access to manga" ON public.manga FOR ALL TO service_role USING (true);

-- Profile policies
CREATE POLICY "Public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own content preferences" ON public.user_content_preferences FOR ALL USING (auth.uid() = user_id);

-- User list policies
CREATE POLICY "Users manage own anime lists" ON public.user_anime_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own manga lists" ON public.user_manga_lists FOR ALL USING (auth.uid() = user_id);

-- Review policies
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users manage own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Review reaction policies
CREATE POLICY "Public read review reactions" ON public.review_reactions FOR SELECT USING (true);
CREATE POLICY "Users manage own reactions" ON public.review_reactions FOR ALL USING (auth.uid() = user_id);

-- Social policies
CREATE POLICY "Public read follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON public.user_follows FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Users view relevant activity" ON public.activity_feed FOR SELECT USING (
  auth.uid() = user_id OR 
  user_id IN (SELECT following_id FROM public.user_follows WHERE follower_id = auth.uid())
);
CREATE POLICY "Users create own activity" ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Content moderation policies
CREATE POLICY "Users create reports" ON public.content_reports FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);
CREATE POLICY "Users view own reports" ON public.content_reports FOR SELECT USING (auth.uid() = reporter_user_id);
CREATE POLICY "Service role manages reports" ON public.content_reports FOR ALL TO service_role USING (true);

-- Public information policies
CREATE POLICY "Public read attributions" ON public.api_attributions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read legal pages" ON public.legal_pages FOR SELECT USING (true);
CREATE POLICY "Service role manages attributions" ON public.api_attributions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role manages legal pages" ON public.legal_pages FOR ALL TO service_role USING (true);

-- System policies
CREATE POLICY "Public read sync status" ON public.content_sync_status FOR SELECT USING (true);
CREATE POLICY "Service role manages sync status" ON public.content_sync_status FOR ALL TO service_role USING (true);
CREATE POLICY "Service role manages sync logs" ON public.sync_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role manages cron logs" ON public.cron_job_logs FOR ALL TO service_role USING (true);

-- ====================================================================
-- TRIGGERS & FUNCTIONS
-- ====================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- User profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, 'user_' || substring(NEW.id::text, 1, 6)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_anime_updated_at BEFORE UPDATE ON public.anime FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_manga_updated_at BEFORE UPDATE ON public.manga FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_content_preferences_updated_at BEFORE UPDATE ON public.user_content_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_anime_lists_updated_at BEFORE UPDATE ON public.user_anime_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_manga_lists_updated_at BEFORE UPDATE ON public.user_manga_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_legal_pages_updated_at BEFORE UPDATE ON public.legal_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User creation trigger
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- STORAGE BUCKETS & POLICIES
-- ====================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('anime-images', 'anime-images', true),
  ('manga-images', 'manga-images', true),
  ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Clear existing storage policies
DELETE FROM storage.objects WHERE bucket_id IN ('anime-images', 'manga-images', 'posts');

-- Anime images policies
CREATE POLICY "Public view anime images" ON storage.objects FOR SELECT USING (bucket_id = 'anime-images');
CREATE POLICY "Service role manage anime images" ON storage.objects FOR ALL USING (bucket_id = 'anime-images');

-- Manga images policies  
CREATE POLICY "Public view manga images" ON storage.objects FOR SELECT USING (bucket_id = 'manga-images');
CREATE POLICY "Service role manage manga images" ON storage.objects FOR ALL USING (bucket_id = 'manga-images');

-- Posts policies
CREATE POLICY "Public view posts" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Users manage own posts" ON storage.objects FOR ALL USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ====================================================================
-- INITIAL DATA
-- ====================================================================

-- Insert API attributions
INSERT INTO public.api_attributions (service_name, attribution_text, license_url, terms_url) VALUES 
('MyAnimeList', 'Anime and manga data provided by MyAnimeList API. All content remains property of their respective owners.', 'https://myanimelist.net/about/terms_of_use', 'https://myanimelist.net/about/terms_of_use'),
('AniList', 'Additional anime data provided by AniList API. All content remains property of their respective owners.', 'https://anilist.co/terms', 'https://anilist.co/terms'),
('Jikan API', 'MyAnimeList data accessed through Jikan API (unofficial). All content remains property of their respective owners.', 'https://jikan.moe/', 'https://jikan.moe/');

-- Insert legal pages
INSERT INTO public.legal_pages (page_type, title, content) VALUES 
('privacy_policy', 'Privacy Policy', 'This Privacy Policy describes how we collect, use, and protect your information when you use our anime and manga tracking application. We collect account information, preferences, and usage analytics to provide personalized recommendations and improve our services. We do not sell personal information to third parties.'),
('terms_of_service', 'Terms of Service', 'By using this application, you agree to these Terms of Service. You must be at least 13 years old, provide accurate information, and respect other users. We reserve the right to moderate content and modify these terms.'),
('content_policy', 'Content Policy', 'Our Content Policy outlines acceptable behavior. Prohibited content includes explicit material involving minors, harassment, spam, and copyright infringement. Content is rated according to industry standards.'),
('copyright_policy', 'Copyright Policy', 'We respect intellectual property rights and comply with DMCA. All anime and manga information is sourced from public APIs with proper attribution. Contact us for copyright concerns.');

-- ====================================================================
-- SCHEDULED TASKS
-- ====================================================================

-- Daily incremental sync at 2 AM UTC
SELECT cron.schedule(
  'daily-incremental-sync',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/incremental-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDk0NzksImV4cCI6MjA2MzA4NTQ3OX0.ySdY2C6kZQhKKNfFVaLeLIzGEw00cJy2iJRFhxixqDo"}'::jsonb,
    body:='{"daysBack": 7}'::jsonb
  ) as request_id;
  $$
);

-- Weekly AniList enhancement on Sundays at 3 AM UTC
SELECT cron.schedule(
  'weekly-anilist-enhancement',
  '0 3 * * 0',
  $$
  SELECT net.http_post(
    url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/sync-anilist-data',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDk0NzksImV4cCI6MjA2MzA4NTQ3OX0.ySdY2C6kZQhKKNfFVaLeLIzGEw00cJy2iJRFhxixqDo"}'::jsonb,
    body:='{"batchSize": 100, "offset": 0}'::jsonb
  ) as request_id;
  $$
);

-- ====================================================================
-- ANALYSIS & STATISTICS VIEWS
-- ====================================================================

-- Anime statistics view
CREATE VIEW public.anime_stats AS
SELECT 
  COUNT(*) as total_anime,
  COUNT(CASE WHEN status = 'Currently Airing' THEN 1 END) as currently_airing,
  COUNT(CASE WHEN status = 'Finished Airing' THEN 1 END) as finished_airing,
  AVG(score) as average_score,
  COUNT(CASE WHEN year = EXTRACT(YEAR FROM NOW()) THEN 1 END) as current_year_anime
FROM public.anime;

-- Manga statistics view  
CREATE VIEW public.manga_stats AS
SELECT 
  COUNT(*) as total_manga,
  COUNT(CASE WHEN status = 'Publishing' THEN 1 END) as currently_publishing,
  COUNT(CASE WHEN status = 'Finished' THEN 1 END) as finished_manga,
  AVG(score) as average_score
FROM public.manga;

-- ====================================================================
-- COMPLETION MESSAGE
-- ====================================================================

-- Log the completion
INSERT INTO public.cron_job_logs (job_name, status, details) 
VALUES ('complete_database_reset', 'completed', '{"message": "Complete optimized database schema deployed successfully with full reset"}');