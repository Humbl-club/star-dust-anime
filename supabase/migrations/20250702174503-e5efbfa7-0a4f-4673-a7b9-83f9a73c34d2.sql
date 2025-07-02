-- Create anime table
CREATE TABLE public.anime (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mal_id INTEGER UNIQUE, -- MyAnimeList ID for API integration
  title TEXT NOT NULL,
  title_english TEXT,
  title_japanese TEXT,
  synopsis TEXT,
  type TEXT DEFAULT 'TV', -- TV, Movie, OVA, Special, etc.
  episodes INTEGER,
  status TEXT DEFAULT 'Finished Airing', -- Airing, Finished Airing, Not yet aired
  aired_from DATE,
  aired_to DATE,
  season TEXT, -- Winter, Spring, Summer, Fall
  year INTEGER,
  score DECIMAL(3,2), -- Rating out of 10
  scored_by INTEGER, -- Number of users who scored
  rank INTEGER,
  popularity INTEGER,
  members INTEGER, -- Number of members who added to list
  favorites INTEGER,
  image_url TEXT,
  trailer_url TEXT,
  genres TEXT[], -- Array of genre names
  studios TEXT[], -- Array of studio names
  themes TEXT[], -- Array of theme names
  demographics TEXT[], -- Array of demographic names (Shounen, Seinen, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create manga table
CREATE TABLE public.manga (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mal_id INTEGER UNIQUE, -- MyAnimeList ID for API integration
  title TEXT NOT NULL,
  title_english TEXT,
  title_japanese TEXT,
  synopsis TEXT,
  type TEXT DEFAULT 'Manga', -- Manga, Novel, Light Novel, etc.
  chapters INTEGER,
  volumes INTEGER,
  status TEXT DEFAULT 'Finished', -- Publishing, Finished, Hiatus, Discontinued
  published_from DATE,
  published_to DATE,
  score DECIMAL(3,2), -- Rating out of 10
  scored_by INTEGER, -- Number of users who scored
  rank INTEGER,
  popularity INTEGER,
  members INTEGER, -- Number of members who added to list
  favorites INTEGER,
  image_url TEXT,
  genres TEXT[], -- Array of genre names
  authors TEXT[], -- Array of author names
  serializations TEXT[], -- Array of serialization names
  themes TEXT[], -- Array of theme names
  demographics TEXT[], -- Array of demographic names
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user anime lists table
CREATE TABLE public.user_anime_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'plan_to_watch', -- watching, completed, on_hold, dropped, plan_to_watch
  score INTEGER CHECK (score >= 1 AND score <= 10),
  episodes_watched INTEGER DEFAULT 0,
  start_date DATE,
  finish_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

-- Create user manga lists table
CREATE TABLE public.user_manga_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  manga_id UUID NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'plan_to_read', -- reading, completed, on_hold, dropped, plan_to_read
  score INTEGER CHECK (score >= 1 AND score <= 10),
  chapters_read INTEGER DEFAULT 0,
  volumes_read INTEGER DEFAULT 0,
  start_date DATE,
  finish_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, manga_id)
);

-- Enable Row Level Security
ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_anime_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_manga_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for anime (public read access)
CREATE POLICY "Anyone can view anime" 
ON public.anime 
FOR SELECT 
USING (true);

-- Create policies for manga (public read access)
CREATE POLICY "Anyone can view manga" 
ON public.manga 
FOR SELECT 
USING (true);

-- Create policies for user anime lists
CREATE POLICY "Users can view their own anime lists" 
ON public.user_anime_lists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own anime list entries" 
ON public.user_anime_lists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anime list entries" 
ON public.user_anime_lists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anime list entries" 
ON public.user_anime_lists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for user manga lists
CREATE POLICY "Users can view their own manga lists" 
ON public.user_manga_lists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own manga list entries" 
ON public.user_manga_lists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manga list entries" 
ON public.user_manga_lists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manga list entries" 
ON public.user_manga_lists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_anime_title ON public.anime USING gin(to_tsvector('english', title));
CREATE INDEX idx_anime_mal_id ON public.anime(mal_id);
CREATE INDEX idx_anime_score ON public.anime(score DESC);
CREATE INDEX idx_anime_popularity ON public.anime(popularity);
CREATE INDEX idx_anime_year ON public.anime(year DESC);
CREATE INDEX idx_anime_status ON public.anime(status);
CREATE INDEX idx_anime_genres ON public.anime USING gin(genres);

CREATE INDEX idx_manga_title ON public.manga USING gin(to_tsvector('english', title));
CREATE INDEX idx_manga_mal_id ON public.manga(mal_id);
CREATE INDEX idx_manga_score ON public.manga(score DESC);
CREATE INDEX idx_manga_popularity ON public.manga(popularity);
CREATE INDEX idx_manga_status ON public.manga(status);
CREATE INDEX idx_manga_genres ON public.manga USING gin(genres);

CREATE INDEX idx_user_anime_lists_user_id ON public.user_anime_lists(user_id);
CREATE INDEX idx_user_anime_lists_status ON public.user_anime_lists(status);
CREATE INDEX idx_user_manga_lists_user_id ON public.user_manga_lists(user_id);
CREATE INDEX idx_user_manga_lists_status ON public.user_manga_lists(status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_anime_updated_at
BEFORE UPDATE ON public.anime
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_manga_updated_at
BEFORE UPDATE ON public.manga
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_anime_lists_updated_at
BEFORE UPDATE ON public.user_anime_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_manga_lists_updated_at
BEFORE UPDATE ON public.user_manga_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();