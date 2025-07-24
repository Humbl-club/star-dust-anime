-- Create user filter presets table
CREATE TABLE public.user_filter_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('anime', 'manga')),
  filters JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_filter_presets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own filter presets" 
ON public.user_filter_presets 
FOR ALL 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_filter_presets_user_content ON public.user_filter_presets(user_id, content_type);

-- Create trigger for updated_at
CREATE TRIGGER update_user_filter_presets_updated_at
BEFORE UPDATE ON public.user_filter_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();