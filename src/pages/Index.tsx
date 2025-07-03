import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { AnimeCard } from "@/components/AnimeCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiData } from "@/hooks/useApiData";
import { useNamePreference } from "@/hooks/useNamePreference";
import { useStats } from "@/hooks/useStats";
import { type Anime } from "@/data/animeData";
import { TrendingUp, Clock, Star, ChevronRight, Loader2 } from "lucide-react";
import { NameToggle } from "@/components/NameToggle";

const Index = () => {
  const navigate = useNavigate();
  const { showEnglish, setShowEnglish, getDisplayName } = useNamePreference();
  const { stats, formatCount } = useStats();
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

  // Helper functions for improved scoring and trending
  const calculateAverageScore = (malScore: number | null, anilistScore: number | null): number => {
    const scores = [malScore, anilistScore].filter(score => score !== null && score > 0);
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score!, 0) / scores.length;
  };

  const calculatePopularityScore = (anime: Anime): number => {
    // AniList-based popularity scoring with timeline factors
    let score = 0;
    
    // Base AniList popularity (primary factor)
    if (anime.popularity) score += anime.popularity * 0.4;
    
    // Member count factor
    if (anime.members) score += Math.log(anime.members) * 10;
    
    // Favorites factor (strong engagement indicator)
    if (anime.favorites) score += Math.log(anime.favorites) * 15;
    
    // Currently airing bonus (timeline constraint)
    if (anime.status === 'Currently Airing') score *= 1.5;
    
    // Recent release bonus
    const releaseDate = new Date(anime.aired_from || 0);
    const monthsAgo = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 12) score *= (1 + (12 - monthsAgo) / 24); // Boost for recent releases
    
    return score;
  };

  const handleAnimeClick = (anime: Anime) => {
    navigate(`/anime/${anime.id}`);
  };

  // Calculate averaged scores and apply smart sorting
  const processedAnime = allAnime.map(anime => ({
    ...anime,
    averageScore: calculateAverageScore(anime.score, anime.anilist_score),
    isCurrentlyAiring: anime.status === 'Currently Airing' || anime.status === 'Ongoing',
    popularityScore: calculatePopularityScore(anime)
  }));

  // Hot right now - Currently airing with high popularity (timeline constraint)
  const currentDate = new Date();
  const trendingAnime = processedAnime
    .filter(anime => anime.isCurrentlyAiring)
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 12);

  // Recently added - Latest entries by aired_from
  const recentlyAdded = [...processedAnime]
    .sort((a, b) => {
      const aDate = new Date(a.aired_from || '1900-01-01');
      const bDate = new Date(b.aired_from || '1900-01-01');
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, 12);

  // Top rated - Best average scores from both sources
  const topRated = [...processedAnime]
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 12);

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
            title="Hot Right Now"
            subtitle="Currently airing anime with highest popularity (AniList-based)"
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
            subtitle="Highest average scores (MAL + AniList combined)"
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
            Join the Ultimate AniVault Community
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">{formatCount(stats.animeCount)}</div>
              <div className="text-muted-foreground">Anime Series</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-secondary">{formatCount(stats.mangaCount)}</div>
              <div className="text-muted-foreground">Manga Titles</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-accent">{formatCount(stats.userCount)}</div>
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