-- Score Validation System Implementation
-- Phase 1: Database Schema Updates

-- Create score validations table with optimized structure
CREATE TABLE public.score_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title_id UUID NOT NULL REFERENCES public.titles(id) ON DELETE CASCADE,
  validation_type TEXT NOT NULL CHECK (validation_type IN ('hidden_gem', 'undervalued', 'accurate_af', 'overhyped', 'bot_farm')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one validation per user per title
  UNIQUE(user_id, title_id)
);

-- Create optimized indexes for performance
CREATE INDEX idx_score_validations_title_id ON public.score_validations(title_id);
CREATE INDEX idx_score_validations_user_id ON public.score_validations(user_id);
CREATE INDEX idx_score_validations_type ON public.score_validations(validation_type);
CREATE INDEX idx_score_validations_title_type ON public.score_validations(title_id, validation_type);

-- Enable RLS
ALTER TABLE public.score_validations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for score validations
CREATE POLICY "Users can view all validations" 
ON public.score_validations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own validations" 
ON public.score_validations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own validations" 
ON public.score_validations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own validations" 
ON public.score_validations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create simple title comments table
CREATE TABLE public.title_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title_id UUID NOT NULL REFERENCES public.titles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for comments
CREATE INDEX idx_title_comments_title_id ON public.title_comments(title_id);
CREATE INDEX idx_title_comments_user_id ON public.title_comments(user_id);
CREATE INDEX idx_title_comments_created_at ON public.title_comments(created_at DESC);

-- Enable RLS for comments
ALTER TABLE public.title_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Users can view all comments" 
ON public.title_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create comments" 
ON public.title_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.title_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.title_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Remove obsolete columns from titles table
ALTER TABLE public.titles DROP COLUMN IF EXISTS members;
ALTER TABLE public.titles DROP COLUMN IF EXISTS favorites;
ALTER TABLE public.titles DROP COLUMN IF EXISTS num_users_voted;

-- Clean up reviews table - remove obsolete anime_id and manga_id columns
ALTER TABLE public.reviews DROP COLUMN IF EXISTS anime_id;
ALTER TABLE public.reviews DROP COLUMN IF EXISTS manga_id;

-- Update reviews table to ensure title_id is not null
UPDATE public.reviews SET title_id = gen_random_uuid() WHERE title_id IS NULL;
ALTER TABLE public.reviews ALTER COLUMN title_id SET NOT NULL;

-- Create database function for efficient validation aggregation
CREATE OR REPLACE FUNCTION public.get_title_validation_stats(title_id_param UUID)
RETURNS TABLE(
  validation_type TEXT,
  count BIGINT,
  percentage NUMERIC
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH validation_counts AS (
    SELECT 
      sv.validation_type,
      COUNT(*) as count
    FROM score_validations sv
    WHERE sv.title_id = title_id_param
    GROUP BY sv.validation_type
  ),
  total_count AS (
    SELECT COALESCE(SUM(count), 0) as total
    FROM validation_counts
  )
  SELECT 
    vc.validation_type,
    vc.count,
    CASE 
      WHEN tc.total > 0 THEN ROUND((vc.count::numeric / tc.total::numeric) * 100, 1)
      ELSE 0
    END as percentage
  FROM validation_counts vc
  CROSS JOIN total_count tc
  ORDER BY vc.count DESC;
$$;

-- Update updated_at trigger for new tables
CREATE TRIGGER update_score_validations_updated_at
  BEFORE UPDATE ON public.score_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_title_comments_updated_at
  BEFORE UPDATE ON public.title_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();