-- Grant execute permissions on RPC functions for detail pages
GRANT EXECUTE ON FUNCTION public.get_anime_detail(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_manga_detail(uuid) TO anon, authenticated;