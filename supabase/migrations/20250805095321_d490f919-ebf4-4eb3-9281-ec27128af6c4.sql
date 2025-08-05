-- Add the missing num_users_voted column to titles table
ALTER TABLE public.titles 
ADD COLUMN IF NOT EXISTS num_users_voted INTEGER DEFAULT 0;

-- Create the pending_matches table for admin review
CREATE TABLE IF NOT EXISTS public.pending_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitsu_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_english TEXT,
  title_japanese TEXT,
  synopsis TEXT,
  image_url TEXT,
  score NUMERIC,
  year INTEGER,
  content_type TEXT NOT NULL CHECK (content_type IN ('anime', 'manga')),
  
  -- Potential matches found by fuzzy search
  potential_matches JSONB DEFAULT '[]'::jsonb,
  
  -- Admin decision tracking
  admin_decision TEXT CHECK (admin_decision IN ('approved', 'rejected', 'merged')) DEFAULT NULL,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  confidence_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS and create policies for pending_matches
ALTER TABLE public.pending_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pending matches" 
ON public.pending_matches FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_matches_content_type ON public.pending_matches(content_type);
CREATE INDEX IF NOT EXISTS idx_pending_matches_admin_decision ON public.pending_matches(admin_decision);
CREATE INDEX IF NOT EXISTS idx_pending_matches_created_at ON public.pending_matches(created_at);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_pending_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pending_matches_updated_at
  BEFORE UPDATE ON public.pending_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_matches_updated_at();