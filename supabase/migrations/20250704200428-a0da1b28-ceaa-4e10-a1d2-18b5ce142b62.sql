-- Fix anime season check constraint to allow more API values
ALTER TABLE public.anime DROP CONSTRAINT IF EXISTS anime_season_check;
ALTER TABLE public.anime ADD CONSTRAINT anime_season_check 
CHECK (season IS NULL OR season = ANY (ARRAY[
  'Winter'::text, 
  'Spring'::text, 
  'Summer'::text, 
  'Fall'::text,
  'WINTER'::text,
  'SPRING'::text, 
  'SUMMER'::text,
  'FALL'::text,
  'winter'::text,
  'spring'::text,
  'summer'::text,
  'fall'::text
]));

-- Fix manga status check constraint to allow more API values  
ALTER TABLE public.manga DROP CONSTRAINT IF EXISTS manga_status_check;
ALTER TABLE public.manga ADD CONSTRAINT manga_status_check
CHECK (status IS NULL OR status = ANY (ARRAY[
  'Publishing'::text,
  'Finished'::text, 
  'On Hiatus'::text,
  'Discontinued'::text,
  'Not yet published'::text,
  'Currently Publishing'::text,
  'Completed'::text,
  'Ongoing'::text,
  'Hiatus'::text,
  'Cancelled'::text,
  'Not Yet Published'::text
]));

-- Also fix anime status to be more flexible
ALTER TABLE public.anime DROP CONSTRAINT IF EXISTS anime_status_check;
ALTER TABLE public.anime ADD CONSTRAINT anime_status_check
CHECK (status IS NULL OR status = ANY (ARRAY[
  'Currently Airing'::text,
  'Finished Airing'::text, 
  'Not yet aired'::text,
  'Cancelled'::text,
  'Airing'::text,
  'Finished'::text,
  'Not Yet Aired'::text,
  'Completed'::text,
  'Ongoing'::text
]));

-- Fix date validation issues by making date fields more flexible
-- Remove problematic date constraints that cause "date/time field value out of range" errors
-- The application should handle date validation instead of database constraints for API data