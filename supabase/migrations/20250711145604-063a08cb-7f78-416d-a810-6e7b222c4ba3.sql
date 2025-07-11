-- Create ALL missing tables that the gamification system needs

-- 1. Create user_points table for tracking user points and gamification
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    daily_points INTEGER NOT NULL DEFAULT 0,
    login_streak INTEGER NOT NULL DEFAULT 0,
    last_login_date DATE,
    first_loot_box_opened BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Create daily_activities table for logging user activities
CREATE TABLE IF NOT EXISTS public.daily_activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create generated_characters table for loot box character data
CREATE TABLE IF NOT EXISTS public.generated_characters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    tier username_tier NOT NULL,
    character_data JSONB NOT NULL DEFAULT '{}',
    generation_method TEXT NOT NULL DEFAULT 'loot_box',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_characters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_points
CREATE POLICY "Users manage own points" ON public.user_points
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role manages user points" ON public.user_points
FOR ALL USING (true);

-- Create RLS policies for daily_activities  
CREATE POLICY "Users view own activities" ON public.daily_activities
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages activities" ON public.daily_activities
FOR ALL USING (true);

-- Create RLS policies for generated_characters
CREATE POLICY "Public read generated characters" ON public.generated_characters
FOR SELECT USING (true);

CREATE POLICY "Service role manages generated characters" ON public.generated_characters
FOR ALL USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_id ON public.daily_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_created_at ON public.daily_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_characters_username ON public.generated_characters(username);