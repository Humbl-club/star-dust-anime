-- Create reviews table
CREATE TABLE public.reviews (
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

-- Create review reactions table
CREATE TABLE public.review_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('helpful', 'unhelpful', 'love', 'funny')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id, reaction_type)
);

-- Create user follows table
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create activity feed table
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('added_to_list', 'completed', 'rated', 'reviewed', 'started_watching', 'started_reading')),
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE,
  manga_id UUID REFERENCES public.manga(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT activity_content_check CHECK (
    (anime_id IS NOT NULL AND manga_id IS NULL) OR 
    (anime_id IS NULL AND manga_id IS NOT NULL)
  )
);

-- Create recommendations table 
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE,
  manga_id UUID REFERENCES public.manga(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('ai_generated', 'similar_users', 'trending', 'genre_based')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reason TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT recommendation_content_check CHECK (
    (anime_id IS NOT NULL AND manga_id IS NULL) OR 
    (anime_id IS NULL AND manga_id IS NOT NULL)
  )
);

-- Create user settings enhancement
CREATE TABLE public.user_preferences (
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

-- Create import/export logs
CREATE TABLE public.import_export_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('import', 'export')),
  source_platform TEXT, -- mal, anilist, kitsu, etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  items_processed INTEGER DEFAULT 0,
  items_total INTEGER DEFAULT 0,
  error_message TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_export_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Anyone can view public reviews" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" 
ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Create policies for review reactions
CREATE POLICY "Anyone can view review reactions" 
ON public.review_reactions FOR SELECT USING (true);

CREATE POLICY "Users can manage their own reactions" 
ON public.review_reactions FOR ALL USING (auth.uid() = user_id);

-- Create policies for user follows
CREATE POLICY "Anyone can view follows" 
ON public.user_follows FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" 
ON public.user_follows FOR ALL USING (auth.uid() = follower_id);

-- Create policies for activity feed
CREATE POLICY "Users can view their own activity and followed users" 
ON public.activity_feed FOR SELECT USING (
  auth.uid() = user_id OR 
  user_id IN (SELECT following_id FROM public.user_follows WHERE follower_id = auth.uid())
);

CREATE POLICY "Users can create their own activity" 
ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for recommendations
CREATE POLICY "Users can view their own recommendations" 
ON public.recommendations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" 
ON public.recommendations FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for user preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Create policies for import/export logs
CREATE POLICY "Users can view their own import/export logs" 
ON public.import_export_logs FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_reviews_anime_id ON public.reviews(anime_id);
CREATE INDEX idx_reviews_manga_id ON public.reviews(manga_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating DESC);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

CREATE INDEX idx_review_reactions_review_id ON public.review_reactions(review_id);
CREATE INDEX idx_review_reactions_user_id ON public.review_reactions(user_id);

CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

CREATE INDEX idx_activity_feed_user_id ON public.activity_feed(user_id);
CREATE INDEX idx_activity_feed_created_at ON public.activity_feed(created_at DESC);

CREATE INDEX idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX idx_recommendations_confidence ON public.recommendations(confidence_score DESC);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_export_logs_updated_at
BEFORE UPDATE ON public.import_export_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();