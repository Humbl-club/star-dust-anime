
-- Add num_users_voted column to the titles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'titles' 
                   AND column_name = 'num_users_voted' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.titles 
        ADD COLUMN num_users_voted integer DEFAULT 0;
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'titles' 
AND table_schema = 'public' 
AND column_name = 'num_users_voted';
