import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { AnimeCard } from "@/components/AnimeCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiData } from "@/hooks/useApiData";
import { useNamePreference } from "@/hooks/useNamePreference";
import { type Anime } from "@/data/animeData";
import { TrendingUp, Clock, Star, ChevronRight, Loader2 } from "lucide-react";
import { NameToggle } from "@/components/NameToggle";

const Index = () => {
  const navigate = useNavigate();
  const { showEnglish, setShowEnglish, getDisplayName } = useNamePreference();
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get anime data from API
  const { data: allAnime, loading } = useApiData<Anime>({ 
    contentType: 'anime',
    limit: 50,
    sort_by: 'score',
    order: 'desc'
  });

  const handleSearch = (query: string) => {
    setIsSearching(true);
    setTimeout(() => {
      const results = allAnime.filter(
        anime => anime.title.toLowerCase().includes(query.toLowerCase()) ||
        anime.title_english?.toLowerCase().includes(query.toLowerCase()) ||
        anime.genres.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const handleAnimeClick = (anime: Anime) => {
    navigate(`/anime/${anime.id}`);
  };

  // Split anime into sections
  const trendingAnime = allAnime.slice(0, 12);
  const recentlyAdded = allAnime.slice(12, 24);
  const topRated = allAnime.slice(24, 36);

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
    animeList: Anime[]; 
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
          <Button 
            variant="outline" 
            className="group"
            onClick={() => navigate('/anime')}
          >
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
                anime={anime} 
                onClick={() => handleAnimeClick(anime)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading anime...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <NameToggle showEnglish={showEnglish} onToggle={setShowEnglish} />
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
                    anime={anime} 
                    onClick={() => handleAnimeClick(anime)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Sections */}
      {searchResults.length === 0 && !isSearching && allAnime.length > 0 && (
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