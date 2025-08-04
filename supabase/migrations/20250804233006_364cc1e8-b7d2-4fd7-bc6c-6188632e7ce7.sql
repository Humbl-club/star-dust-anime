-- Enable RLS on tables that need it for the streaming availability system
-- The streaming_availability_cache table already has RLS enabled

-- Create RLS policies for titles table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'titles' AND policyname = 'Public read titles'
    ) THEN
        CREATE POLICY "Public read titles" ON titles FOR SELECT USING (true);
    END IF;
END $$;

-- Create RLS policies for anime_details table if not exists  
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'anime_details' AND policyname = 'Public read anime_details'
    ) THEN
        CREATE POLICY "Public read anime_details" ON anime_details FOR SELECT USING (true);
    END IF;
END $$;

-- Create RLS policies for manga_details table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'manga_details' AND policyname = 'Public read manga_details'
    ) THEN
        CREATE POLICY "Public read manga_details" ON manga_details FOR SELECT USING (true);
    END IF;
END $$;