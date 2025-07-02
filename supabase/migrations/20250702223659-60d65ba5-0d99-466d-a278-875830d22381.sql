-- Create influencers table
CREATE TABLE public.influencers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  youtube_channel TEXT,
  twitter_handle TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  specialty_genres TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create curated lists table
CREATE TABLE public.curated_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  follower_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create curated list items table
CREATE TABLE public.curated_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.curated_lists(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES public.anime(id) ON DELETE CASCADE,
  manga_id UUID REFERENCES public.manga(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  curator_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CHECK ((anime_id IS NOT NULL AND manga_id IS NULL) OR (anime_id IS NULL AND manga_id IS NOT NULL))
);

-- Create video content table
CREATE TABLE public.video_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  platform TEXT NOT NULL, -- youtube, tiktok, etc
  platform_video_id TEXT,
  duration_seconds INTEGER,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  anime_id UUID REFERENCES public.anime(id) ON DELETE SET NULL,
  manga_id UUID REFERENCES public.manga(id) ON DELETE SET NULL,
  tags TEXT[],
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create list follows table
CREATE TABLE public.list_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.curated_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, list_id)
);

-- Create influencer follows table
CREATE TABLE public.influencer_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, influencer_id)
);

-- Create detailed anime stats table
CREATE TABLE public.anime_detailed_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE UNIQUE,
  watching_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  on_hold_count INTEGER DEFAULT 0,
  dropped_count INTEGER DEFAULT 0,
  plan_to_watch_count INTEGER DEFAULT 0,
  score_distribution JSONB DEFAULT '{}',
  age_demographics JSONB DEFAULT '{}',
  gender_demographics JSONB DEFAULT '{}',
  country_demographics JSONB DEFAULT '{}',
  seasonal_popularity JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_detailed_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for influencers
CREATE POLICY "Anyone can view verified influencers" ON public.influencers
  FOR SELECT USING (verified = true OR true);

CREATE POLICY "Users can create their influencer profile" ON public.influencers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their influencer profile" ON public.influencers
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for curated lists
CREATE POLICY "Anyone can view public lists" ON public.curated_lists
  FOR SELECT USING (is_public = true);

CREATE POLICY "Influencers can manage their lists" ON public.curated_lists
  FOR ALL USING (influencer_id IN (SELECT id FROM public.influencers WHERE user_id = auth.uid()));

-- RLS Policies for list items
CREATE POLICY "Anyone can view public list items" ON public.curated_list_items
  FOR SELECT USING (list_id IN (SELECT id FROM public.curated_lists WHERE is_public = true));

CREATE POLICY "List owners can manage items" ON public.curated_list_items
  FOR ALL USING (list_id IN (
    SELECT cl.id FROM public.curated_lists cl 
    JOIN public.influencers i ON cl.influencer_id = i.id 
    WHERE i.user_id = auth.uid()
  ));

-- RLS Policies for video content
CREATE POLICY "Anyone can view video content" ON public.video_content
  FOR SELECT USING (true);

CREATE POLICY "Influencers can manage their videos" ON public.video_content
  FOR ALL USING (influencer_id IN (SELECT id FROM public.influencers WHERE user_id = auth.uid()));

-- RLS Policies for follows
CREATE POLICY "Users can manage their follows" ON public.list_follows
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their influencer follows" ON public.influencer_follows
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for anime stats
CREATE POLICY "Anyone can view anime stats" ON public.anime_detailed_stats
  FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_influencers_user_id ON public.influencers(user_id);
CREATE INDEX idx_influencers_verified ON public.influencers(verified);
CREATE INDEX idx_curated_lists_influencer ON public.curated_lists(influencer_id);
CREATE INDEX idx_curated_lists_public ON public.curated_lists(is_public);
CREATE INDEX idx_list_items_list_id ON public.curated_list_items(list_id);
CREATE INDEX idx_list_items_position ON public.curated_list_items(list_id, position);
CREATE INDEX idx_video_content_influencer ON public.video_content(influencer_id);
CREATE INDEX idx_video_content_anime ON public.video_content(anime_id);
CREATE INDEX idx_video_content_published ON public.video_content(published_at DESC);
CREATE INDEX idx_list_follows_user ON public.list_follows(user_id);
CREATE INDEX idx_list_follows_list ON public.list_follows(list_id);
CREATE INDEX idx_influencer_follows_user ON public.influencer_follows(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_curated_lists_updated_at
  BEFORE UPDATE ON public.curated_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_content_updated_at
  BEFORE UPDATE ON public.video_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anime_detailed_stats_updated_at
  BEFORE UPDATE ON public.anime_detailed_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();