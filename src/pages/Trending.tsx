import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { useSimpleNewApiData } from "@/hooks/useSimpleNewApiData";
import { Loader2 } from "lucide-react";

const Trending = () => {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState<'anime' | 'manga'>('anime');

  // Use the new optimized hook for trending anime
  const { data: trendingAnime, loading: animeLoading } = useSimpleNewApiData({
    contentType: 'anime',
    limit: 24,
    sort_by: 'popularity',
    order: 'desc'
  });

  // Use the new optimized hook for trending manga
  const { data: trendingManga, loading: mangaLoading } = useSimpleNewApiData({
    contentType: 'manga', 
    limit: 24,
    sort_by: 'popularity',
    order: 'desc'
  });

  const isLoading = animeLoading || mangaLoading;
  const data = contentType === 'anime' ? trendingAnime : trendingManga;

  const handleItemClick = (item: any) => {
    // Determine content type and navigate
    const type = item.anime_details ? 'anime' : 'manga';
    navigate(`/${type}/${item.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg">Loading trending content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto py-8">
        {/* Content type toggle */}
        <Tabs value={contentType} onValueChange={(v) => setContentType(v as 'anime' | 'manga')}>
          <TabsList>
            <TabsTrigger value="anime">Trending Anime</TabsTrigger>
            <TabsTrigger value="manga">Trending Manga</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
          {data?.map((item) => (
            <div
              key={item.id}
              className="cursor-pointer group"
              onClick={() => handleItemClick(item)}
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={item.image_url || '/placeholder.jpg'}
                  alt={item.title}
                  className="w-full aspect-[3/4] object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 p-4">
                    <p className="text-white font-semibold">{item.title}</p>
                    {item.score && (
                      <p className="text-white/80 text-sm">★ {item.score}</p>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium line-clamp-2">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Trending;