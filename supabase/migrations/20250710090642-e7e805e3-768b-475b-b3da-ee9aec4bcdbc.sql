-- Create user filter presets table
CREATE TABLE public.user_filter_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('anime', 'manga')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_filter_presets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users manage own filter presets" 
ON public.user_filter_presets 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_filter_presets_updated_at
BEFORE UPDATE ON public.user_filter_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_user_filter_presets_user_id ON public.user_filter_presets(user_id);
CREATE INDEX idx_user_filter_presets_content_type ON public.user_filter_presets(content_type);