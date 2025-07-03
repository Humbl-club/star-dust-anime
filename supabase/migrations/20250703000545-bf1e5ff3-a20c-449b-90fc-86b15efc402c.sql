-- Temporarily disable RLS on manga table for testing
ALTER TABLE public.manga DISABLE ROW LEVEL SECURITY;

-- Insert some test manga data
INSERT INTO manga (mal_id, title, title_english, synopsis, type, status, score, popularity, genres, image_url) VALUES 
(2, 'Berserk', 'Berserk', 'Guts, a former mercenary now known as the Black Swordsman, is out for revenge.', 'Manga', 'Publishing', 9.4, 50000, '{"Action","Drama","Fantasy"}', 'https://cdn.myanimelist.net/images/manga/1/157897l.jpg'),
(11, 'Naruto', 'Naruto', 'Twelve years before the start of the series, the Nine-Tails attacked Konohagakure.', 'Manga', 'Finished', 8.1, 120000, '{"Action","Adventure","Martial Arts"}', 'https://cdn.myanimelist.net/images/manga/3/249658l.jpg'),
(13, 'One Piece', 'One Piece', 'Gol D. Roger was known as the Pirate King, the strongest and most infamous being.', 'Manga', 'Publishing', 9.1, 200000, '{"Action","Adventure","Comedy"}', 'https://cdn.myanimelist.net/images/manga/2/253146l.jpg'),
(116778, 'Chainsaw Man', 'Chainsaw Man', 'Denji has a simple dream—to live a happy and peaceful life.', 'Manga', 'Publishing', 8.7, 80000, '{"Action","Comedy","Supernatural"}', 'https://cdn.myanimelist.net/images/manga/3/216464l.jpg'),
(44347, 'One Punch-Man', 'One Punch-Man', 'After rigorously training for three years, the ordinary Saitama has gained immense strength.', 'Manga', 'Publishing', 8.8, 90000, '{"Action","Comedy","Superhero"}', 'https://cdn.myanimelist.net/images/manga/3/325187l.jpg')
ON CONFLICT (mal_id) DO NOTHING;

-- Re-enable RLS with proper policies
ALTER TABLE public.manga ENABLE ROW LEVEL SECURITY;