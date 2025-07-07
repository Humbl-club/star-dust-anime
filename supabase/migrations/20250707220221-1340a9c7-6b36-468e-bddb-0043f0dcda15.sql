-- Add missing unique constraints for upsert operations

-- Add unique constraint on anilist_id for titles table
ALTER TABLE public.titles ADD CONSTRAINT titles_anilist_id_unique UNIQUE (anilist_id);

-- Add unique constraint on title_id for anime_details table  
ALTER TABLE public.anime_details ADD CONSTRAINT anime_details_title_id_unique UNIQUE (title_id);

-- Add unique constraint on title_id for manga_details table
ALTER TABLE public.manga_details ADD CONSTRAINT manga_details_title_id_unique UNIQUE (title_id);

-- Add unique constraint on name for genres table
ALTER TABLE public.genres ADD CONSTRAINT genres_name_unique UNIQUE (name);

-- Add unique constraint on name for studios table
ALTER TABLE public.studios ADD CONSTRAINT studios_name_unique UNIQUE (name);

-- Add unique constraint on name for authors table
ALTER TABLE public.authors ADD CONSTRAINT authors_name_unique UNIQUE (name);