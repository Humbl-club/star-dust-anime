
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { PersonalizedDashboard } from "@/components/PersonalizedDashboard";
import { DataTestComponent } from "@/components/DataTestComponent";

import { AnimeCard } from "@/components/AnimeCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSimpleNewApiData } from "@/hooks/useSimpleNewApiData";
import { useNamePreference } from "@/hooks/useNamePreference";
import { useStats } from "@/hooks/useStats";
import { useAuth } from "@/hooks/useAuth";
import { type Anime } from "@/data/animeData";
import { TrendingUp, Clock, Star, ChevronRight, Loader2 } from "lucide-react";
import { EmailVerificationPopup } from "@/components/EmailVerificationPopup";
import { LegalFooter } from "@/components/LegalFooter";

// Debug component to show what's happening
const DebugPanel = ({ data }: { data: any }) => {
  const [showRaw, setShowRaw] = useState(false);
  
  return (
    <div className="fixed top-20 right-4 z-50 bg-black/90 text-white p-4 rounded-lg max-w-md">
      <h3 className="font-bold text-yellow-400 mb-2">Debug Info</h3>
      <div className="space-y-1 text-sm">
        <p>Hook: {data.hookName}</p>
        <p>Loading: {data.loading ? '🔄 Yes' : '✅ No'}</p>
        <p>Error: {data.error || 'None'}</p>
        <p>Data Count: {data.dataCount}</p>
        <p>First Item: {data.firstItem?.title || 'No data'}</p>
        <button 
          onClick={() => setShowRaw(!showRaw)}
          className="text-blue-400 underline"
        >
          {showRaw ? 'Hide' : 'Show'} Raw Data
        </button>
        {showRaw && (
          <pre className="text-xs overflow-auto max-h-60 mt-2">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showEnglish, setShowEnglish, getDisplayName } = useNamePreference();
  const { stats, formatCount } = useStats();
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [triggerEmailPopup, setTriggerEmailPopup] = useState(false);
  const [showTestData, setShowTestData] = useState(false);
  

  // Get anime data from API
  const { data: allAnime, loading } = useSimpleNewApiData({ 
    contentType: 'anime',
    limit: 50,
    sort_by: 'score',
    order: 'desc'
  });

  const handleSearch = (query: string) => {
    // Search will be handled by the Navigation component
    // This is kept for compatibility but not used
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
      const aDate = new Date((a as any).aired_from || (a as any).published_from || '1900-01-01');
      const bDate = new Date((b as any).aired_from || (b as any).published_from || '1900-01-01');
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
    icon: React.ComponentType<{ className?: string }>; 
    animeList: Anime[]; 
    className?: string;
  }) => (
    <section className={`py-8 md:py-16 ${className}`}>
      <div className="container mx-auto mobile-safe-padding">
        {/* Mobile-optimized header */}
        <div className="flex items-start justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-xl touch-friendly">
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-3xl font-bold truncate">{title}</h2>
              <p className="text-xs md:text-base text-muted-foreground line-clamp-1 md:line-clamp-none">{subtitle}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="group touch-friendly ml-2 shrink-0"
            onClick={() => navigate('/anime')}
          >
            <span className="hidden sm:inline">View All</span>
            <span className="sm:hidden">More</span>
            <ChevronRight className="w-4 h-4 ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        {/* Mobile-optimized grid with horizontal scroll on small screens */}
        <div className="lg:grid lg:grid-cols-5 xl:grid-cols-6 lg:gap-6 hidden">
          {animeList.map((anime, index) => (
            <div 
              key={anime.id} 
              className="group animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <AnimeCard 
                anime={anime} 
                onClick={() => handleAnimeClick(anime)}
                getDisplayName={getDisplayName}
              />
            </div>
          ))}
        </div>

        {/* Mobile horizontal scroll */}
        <div className="lg:hidden">
          <div className="flex gap-3 overflow-x-auto pb-4 native-scroll">
            {animeList.slice(0, 8).map((anime, index) => (
              <div 
                key={anime.id} 
                className="flex-none w-40 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <AnimeCard 
                  anime={anime} 
                  onClick={() => handleAnimeClick(anime)}
                  getDisplayName={getDisplayName}
                />
              </div>
            ))}
          </div>
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
    <div className="min-h-screen relative native-app">
      <DebugPanel data={{
        hookName: 'useSimpleNewApiData',
        loading,
        error: null,
        dataCount: allAnime.length,
        firstItem: allAnime[0],
        allAnime
      }} />
      
      <Navigation onSearch={handleSearch} />
      
      {/* Mobile-optimized Hero Section */}
      <HeroSection onSearch={handleSearch} />

      {/* Debug Toggle Button */}
      <div className="container mx-auto px-4 py-4">
        <Button 
          onClick={() => setShowTestData(!showTestData)}
          variant="outline"
          size="sm"
        >
          {showTestData ? 'Hide' : 'Show'} Test Data
        </Button>
      </div>

      {/* Test Data Component */}
      {showTestData && <DataTestComponent />}

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
                    getDisplayName={getDisplayName}
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

      {/* Mobile-optimized Stats Footer */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto mobile-safe-padding text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 px-4">
            Join the Ultimate <span className="text-accent">Ani</span><span className="text-primary">thing</span> Community
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
            <div className="space-y-1 md:space-y-2 p-4 glass-card border border-primary/20 rounded-xl hover-scale">
              <div className="text-2xl md:text-4xl font-bold text-primary">{formatCount(stats.animeCount)}</div>
              <div className="text-xs md:text-base text-muted-foreground">Anime Series</div>
            </div>
            <div className="space-y-1 md:space-y-2 p-4 glass-card border border-accent/20 rounded-xl hover-scale">
              <div className="text-2xl md:text-4xl font-bold text-accent">{formatCount(stats.mangaCount)}</div>
              <div className="text-xs md:text-base text-muted-foreground">Manga Titles</div>
            </div>
            <div className="space-y-1 md:space-y-2 p-4 glass-card border border-secondary/20 rounded-xl hover-scale">
              <div className="text-2xl md:text-4xl font-bold text-secondary">{formatCount(stats.userCount)}</div>
              <div className="text-xs md:text-base text-muted-foreground">Users</div>
            </div>
            <div className="space-y-1 md:space-y-2 p-4 glass-card border border-primary/20 rounded-xl hover-scale">
              <div className="text-2xl md:text-4xl font-bold text-primary">24/7</div>
              <div className="text-xs md:text-base text-muted-foreground">Updates</div>
            </div>
          </div>
          <div className="mt-8 md:mt-12 px-4">
            <Button 
              variant="hero" 
              size="lg" 
              className="px-8 md:px-12 py-4 text-base md:text-lg w-full sm:w-auto touch-friendly"
              onClick={() => navigate('/auth?tab=signup')}
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      <LegalFooter />

      {/* Coordinated Email Verification Popup */}
      <EmailVerificationPopup triggerShow={triggerEmailPopup} />
      
    </div>
  );
};

export default Index;
