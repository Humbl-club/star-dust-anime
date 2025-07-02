import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { AnimeCard } from "@/components/AnimeCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTrendingAnime, getRecentlyAdded, getTopRated, type AnimeData } from "@/data/mockData";
import { type Anime } from "@/data/animeData";
import { TrendingUp, Clock, Star, ChevronRight } from "lucide-react";

const Index = () => {
  const [searchResults, setSearchResults] = useState<AnimeData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const trendingAnime = getTrendingAnime();
  const recentlyAdded = getRecentlyAdded();
  const topRated = getTopRated();

  const handleSearch = (query: string) => {
    setIsSearching(true);
    // Simulate API search - in production this would be a real API call
    setTimeout(() => {
      const results = [...trendingAnime, ...recentlyAdded, ...topRated].filter(
        anime => anime.title.toLowerCase().includes(query.toLowerCase()) ||
        anime.genres.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const handleAnimeClick = (anime: AnimeData) => {
    console.log("Opening anime details for:", anime.title);
    // In production, this would navigate to a detailed anime page
  };

  // Convert AnimeData to Anime format
  const convertToAnime = (data: AnimeData): Anime => ({
    id: data.id.toString(),
    title: data.title,
    synopsis: data.synopsis || "",
    type: data.type === "anime" ? "TV" : "Movie",
    episodes: data.episode_count,
    status: data.status,
    year: data.year,
    score: data.rating,
    image_url: data.image,
    genres: data.genres
  });

  const AnimeSection = ({ 
    title, 
    subtitle, 
    icon: Icon, 
    animeList, 
    className = "" 
  }: { 
    title: string; 
    subtitle: string; 
    icon: any; 
    animeList: AnimeData[]; 
    className?: string;
  }) => (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gradient-primary">{title}</h2>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <Button variant="outline" className="group">
            View All
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {animeList.map((anime, index) => (
            <div 
              key={anime.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <AnimeCard 
                anime={convertToAnime(anime)} 
                onClick={() => handleAnimeClick(anime)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen">
      <Navigation onSearch={handleSearch} />
      
      {/* Hero Section */}
      <HeroSection onSearch={handleSearch} />

      {/* Search Results */}
      {isSearching && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-lg">Searching...</span>
            </div>
          </div>
        </section>
      )}

      {searchResults.length > 0 && !isSearching && (
        <section className="py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gradient-primary mb-2">Search Results</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{searchResults.length} results found</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {searchResults.map((anime, index) => (
                <div 
                  key={anime.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <AnimeCard 
                    anime={convertToAnime(anime)} 
                    onClick={() => handleAnimeClick(anime)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Sections */}
      {searchResults.length === 0 && !isSearching && (
        <>
          <AnimeSection
            title="Trending Now"
            subtitle="Most popular anime this week"
            icon={TrendingUp}
            animeList={trendingAnime}
            className="bg-muted/10"
          />

          <AnimeSection
            title="Recently Added"
            subtitle="Latest additions to our catalog"
            icon={Clock}
            animeList={recentlyAdded}
          />

          <AnimeSection
            title="Top Rated"
            subtitle="Highest rated series of all time"
            icon={Star}
            animeList={topRated}
            className="bg-muted/10"
          />
        </>
      )}

      {/* Stats Footer */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gradient-primary mb-8">
            Join the Ultimate Anime Community
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">50K+</div>
              <div className="text-muted-foreground">Anime Series</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-secondary">100K+</div>
              <div className="text-muted-foreground">Manga Titles</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-accent">1M+</div>
              <div className="text-muted-foreground">Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary-glow">24/7</div>
              <div className="text-muted-foreground">Updates</div>
            </div>
          </div>
          <div className="mt-12">
            <Button variant="hero" size="lg" className="px-12 py-4 text-lg">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
