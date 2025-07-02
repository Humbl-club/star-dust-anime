-- ===============================================
-- OPTIMIZED ANIME/MANGA DATABASE SCHEMA
-- Enhanced for auto-sync, performance, and production use
-- ===============================================

-- Create optimized anime table with all enhanced fields
CREATE TABLE IF NOT EXISTS public.anime (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mal_id INTEGER,
  anilist_id INTEGER,
  title TEXT NOT NULL,
  title_english TEXT,
  title_japanese TEXT,
  synopsis TEXT,
  type TEXT DEFAULT 'TV',
  episodes INTEGER,
  status TEXT DEFAULT 'Finished Airing',
  aired_from DATE,
  aired_to DATE,
  season TEXT,
  year INTEGER,
  score NUMERIC(4,2) CHECK (score >= 0 AND score <= 10),
  scored_by INTEGER,
  rank INTEGER,
  popularity INTEGER,
  members INTEGER,
  favorites INTEGER,
  image_url TEXT,
  banner_image TEXT,
  cover_image_large TEXT,
  cover_image_extra_large TEXT,
  color_theme TEXT,
  trailer_url TEXT,
  trailer_id TEXT,
  trailer_site TEXT,
  genres TEXT[] DEFAULT '{}',
  studios TEXT[] DEFAULT '{}',
  themes TEXT[] DEFAULT '{}',
  demographics TEXT[] DEFAULT '{}',
  
  -- Enhanced sync and schedule fields
  next_episode_date TIMESTAMP WITH TIME ZONE,
  next_episode_number INTEGER,
  airing_schedule JSONB DEFAULT '[]'::jsonb,
  last_sync_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Rich metadata from AniList
  characters_data JSONB DEFAULT '[]'::jsonb,
  staff_data JSONB DEFAULT '[]'::jsonb,
  external_links JSONB DEFAULT '[]'::jsonb,
  streaming_episodes JSONB DEFAULT '[]'::jsonb,
  detailed_tags JSONB DEFAULT '[]'::jsonb,
  relations_data JSONB DEFAULT '[]'::jsonb,
  recommendations_data JSONB DEFAULT '[]'::jsonb,
  studios_data JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create optimized manga table with enhanced fields
CREATE TABLE IF NOT EXISTS public.manga (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mal_id INTEGER,
  anilist_id INTEGER,
  title TEXT NOT NULL,
  title_english TEXT,
  title_japanese TEXT,
  synopsis TEXT,
  type TEXT DEFAULT 'Manga',
  chapters INTEGER,
  volumes INTEGER,
  status TEXT DEFAULT 'Finished',
  published_from DATE,
  published_to DATE,
  score NUMERIC(4,2) CHECK (score >= 0 AND score <= 10),
  scored_by INTEGER,
  rank INTEGER,
  popularity INTEGER,
  members INTEGER,
  favorites INTEGER,
  image_url TEXT,
  genres TEXT[] DEFAULT '{}',
  authors TEXT[] DEFAULT '{}',
  serializations TEXT[] DEFAULT '{}',
  themes TEXT[] DEFAULT '{}',
  demographics TEXT[] DEFAULT '{}',
  
  -- Enhanced sync and schedule fields
  next_chapter_date TIMESTAMP WITH TIME ZONE,
  next_chapter_number INTEGER,
  release_schedule JSONB DEFAULT '[]'::jsonb,
  last_sync_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User lists with enhanced tracking
CREATE TABLE IF NOT EXISTS public.user_anime_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'plan_to_watch' 
    CHECK (status IN ('watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch')),
  score INTEGER CHECK (score >= 1 AND score <= 10),
  episodes_watched INTEGER DEFAULT 0 CHECK (episodes_watched >= 0),
  start_date DATE,
  finish_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

CREATE TABLE IF NOT EXISTS public.user_manga_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  manga_id UUID NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'plan_to_read'
    CHECK (status IN ('reading', 'completed', 'on_hold', 'dropped', 'plan_to_read')),
  score INTEGER CHECK (score >= 1 AND score <= 10),
  chapters_read INTEGER DEFAULT 0 CHECK (chapters_read >= 0),
  volumes_read INTEGER DEFAULT 0 CHECK (volumes_read >= 0),
  start_date DATE,
  finish_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

-- Enhanced reviews system
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE,
  manga_id UUID REFERENCES public.manga(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  title TEXT,
  content TEXT NOT NULL,
  spoiler_warning BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT reviews_content_check CHECK (
    (anime_id IS NOT NULL AND manga_id IS NULL) OR 
    (anime_id IS NULL AND manga_id IS NOT NULL)
  ),
  CONSTRAINT reviews_user_content_unique UNIQUE (user_id, anime_id, manga_id)
);

CREATE TABLE IF NOT EXISTS public.review_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('helpful', 'unhelpful', 'love', 'funny')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id, reaction_type)
);

-- Social features
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN 
    ('added_to_list', 'completed', 'rated', 'reviewed', 'started_watching', 'started_reading')),
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE,
  manga_id UUID REFERENCES public.manga(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT activity_content_check CHECK (
    (anime_id IS NOT NULL AND manga_id IS NULL) OR 
    (anime_id IS NULL AND manga_id IS NOT NULL)
  )
);

-- AI Recommendations system
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE,
  manga_id UUID REFERENCES public.manga(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN 
    ('ai_generated', 'similar_users', 'trending', 'genre_based')),
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reason TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT recommendation_content_check CHECK (
    (anime_id IS NOT NULL AND manga_id IS NULL) OR 
    (anime_id IS NULL AND manga_id IS NOT NULL)
  )
);

-- Enhanced user preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('private', 'friends', 'public')),
  show_adult_content BOOLEAN DEFAULT false,
  preferred_genres TEXT[] DEFAULT '{}',
  excluded_genres TEXT[] DEFAULT '{}',
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "reviews": true, "follows": true}',
  list_visibility TEXT DEFAULT 'public' CHECK (list_visibility IN ('private', 'friends', 'public')),
  auto_add_sequels BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sync tracking system
CREATE TABLE IF NOT EXISTS public.content_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('anime', 'manga')),
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 1,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE
);

-- Import/Export tracking
CREATE TABLE IF NOT EXISTS public.import_export_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('import', 'export')),
  source_platform TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  items_processed INTEGER DEFAULT 0,
  items_total INTEGER DEFAULT 0,
  error_message TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===============================================
-- PERFORMANCE OPTIMIZED INDEXES
-- ===============================================

-- Anime table indexes
CREATE INDEX IF NOT EXISTS idx_anime_title_gin ON public.anime USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_anime_mal_id ON public.anime(mal_id) WHERE mal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anime_anilist_id ON public.anime(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_anime_mal_unique ON public.anime(mal_id) WHERE mal_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_anime_anilist_unique ON public.anime(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anime_score_popularity ON public.anime(score DESC, popularity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_anime_year_season ON public.anime(year DESC, season);
CREATE INDEX IF NOT EXISTS idx_anime_status_active ON public.anime(status) WHERE status IN ('Currently Airing', 'Not yet aired');
CREATE INDEX IF NOT EXISTS idx_anime_genres_gin ON public.anime USING gin(genres);
CREATE INDEX IF NOT EXISTS idx_anime_next_episode ON public.anime(next_episode_date) WHERE next_episode_date IS NOT NULL;

-- Manga table indexes
CREATE INDEX IF NOT EXISTS idx_manga_title_gin ON public.manga USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_manga_mal_id ON public.manga(mal_id) WHERE mal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_manga_anilist_id ON public.manga(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_manga_mal_unique ON public.manga(mal_id) WHERE mal_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_manga_anilist_unique ON public.manga(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_manga_score_popularity ON public.manga(score DESC, popularity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_manga_status_active ON public.manga(status) WHERE status = 'Publishing';
CREATE INDEX IF NOT EXISTS idx_manga_genres_gin ON public.manga USING gin(genres);

-- User lists indexes
CREATE INDEX IF NOT EXISTS idx_user_anime_user_status ON public.user_anime_lists(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_anime_updated ON public.user_anime_lists(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_manga_user_status ON public.user_manga_lists(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_manga_updated ON public.user_manga_lists(user_id, updated_at DESC);

-- Social features indexes
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_created ON public.activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_follows ON public.activity_feed(user_id) WHERE user_id IN (SELECT following_id FROM user_follows);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_anime_rating ON public.reviews(anime_id, rating DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_manga_rating ON public.reviews(manga_id, rating DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user_created ON public.reviews(user_id, created_at DESC);

-- Sync tracking indexes
CREATE INDEX IF NOT EXISTS idx_sync_status_type_status ON public.content_sync_status(content_type, status, started_at DESC);

-- ===============================================
-- ROW LEVEL SECURITY POLICIES
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_anime_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_manga_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_export_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies for content
CREATE POLICY "Anyone can view anime" ON public.anime FOR SELECT USING (true);
CREATE POLICY "Anyone can view manga" ON public.manga FOR SELECT USING (true);
CREATE POLICY "Anyone can view sync status" ON public.content_sync_status FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can manage their anime lists" ON public.user_anime_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their manga lists" ON public.user_manga_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their import logs" ON public.import_export_logs FOR ALL USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view public reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Review reactions policies
CREATE POLICY "Anyone can view review reactions" ON public.review_reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reactions" ON public.review_reactions FOR ALL USING (auth.uid() = user_id);

-- Social policies
CREATE POLICY "Anyone can view follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follows" ON public.user_follows FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Users can view their own activity and followed users" ON public.activity_feed FOR SELECT USING (
  auth.uid() = user_id OR 
  user_id IN (SELECT following_id FROM public.user_follows WHERE follower_id = auth.uid())
);
CREATE POLICY "Users can create their own activity" ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recommendations policies
CREATE POLICY "Users can view their own recommendations" ON public.recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own recommendations" ON public.recommendations FOR UPDATE USING (auth.uid() = user_id);

-- ===============================================
-- AUTOMATIC TIMESTAMP TRIGGERS
-- ===============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
DROP TRIGGER IF EXISTS update_anime_updated_at ON public.anime;
CREATE TRIGGER update_anime_updated_at
  BEFORE UPDATE ON public.anime
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_manga_updated_at ON public.manga;
CREATE TRIGGER update_manga_updated_at
  BEFORE UPDATE ON public.manga
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_anime_lists_updated_at ON public.user_anime_lists;
CREATE TRIGGER update_user_anime_lists_updated_at
  BEFORE UPDATE ON public.user_anime_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_manga_lists_updated_at ON public.user_manga_lists;
CREATE TRIGGER update_user_manga_lists_updated_at
  BEFORE UPDATE ON public.user_manga_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_import_export_logs_updated_at ON public.import_export_logs;
CREATE TRIGGER update_import_export_logs_updated_at
  BEFORE UPDATE ON public.import_export_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===============================================
-- STORAGE SETUP
-- ===============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('anime-images', 'anime-images', true),
  ('manga-images', 'manga-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view anime images" ON storage.objects FOR SELECT USING (bucket_id = 'anime-images');
CREATE POLICY "Anyone can view manga images" ON storage.objects FOR SELECT USING (bucket_id = 'manga-images');
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- ===============================================
-- AUTOMATED SYNC SCHEDULING
-- ===============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing cron job if exists
SELECT cron.unschedule('intelligent-content-sync-6h');

-- Create optimized 6-hour sync job
SELECT cron.schedule(
  'intelligent-content-sync-6h',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://axtpbgsjbmhbuqomarcr.supabase.co/functions/v1/schedule-cron-trigger',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dHBiZ3NqYm1oYnVxb21hcmNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzUwOTQ3OSwiZXhwIjoyMDYzMDg1NDc5fQ.VmAjOGbKcwZTbLmk9k4MZJoZ6ZYi4DFXSIO_6-OAyrc"}'::jsonb,
        body:=concat('{"trigger": "cron", "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);