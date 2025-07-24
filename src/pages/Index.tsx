import { useState, useEffect, useMemo, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { PersonalizedDashboard } from "@/components/PersonalizedDashboard";

import { AnimeCard } from "@/components/features/AnimeCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContentData } from "@/hooks/useContentData";
import { useNamePreference } from "@/hooks/useNamePreference";
import { useStats } from "@/hooks/useStats";
import { useAuth } from "@/hooks/useAuth";
import { type Anime } from "@/data/animeData";
import { TrendingUp, Clock, Star, ChevronRight, Loader2 } from "lucide-react";
import { EmailVerificationPopup } from "@/components/EmailVerificationPopup";
import { LegalFooter } from "@/components/LegalFooter";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from '@tanstack/react-query';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showEnglish, setShowEnglish, getDisplayName } = useNamePreference();
  const { stats, formatCount } = useStats();
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [triggerEmailPopup, setTriggerEmailPopup] = useState(false);
  const queryClient = useQueryClient();
  
  // Database population state
  const [isPopulating, setIsPopulating] = useState(false);
  const [populationStatus, setPopulationStatus] = useState<string>('');
  

  // Get anime data using cached edge function for ultra-fast loading
  const { data: allAnime, loading: animeLoading, error: animeError } = useContentData({
    contentType: 'anime',
    page: 1,
    limit: 36, // Increased for better homepage sections
    sort_by: 'score',
    order: 'desc',
    useOptimized: true,
    useEdgeCache: true // Use new edge function for aggregated home data
  });

  // Create homepage sections from cached edge data using useMemo for performance
  const trendingAnime = useMemo(() => allAnime?.slice(0, 12) || [], [allAnime]);
  const recentlyAdded = useMemo(() => allAnime?.slice(12, 24) || [], [allAnime]);
  const topRated = useMemo(() => allAnime?.slice(24, 36) || [], [allAnime]);
  const loading = animeLoading;
  const error = animeError;

  // Debug: Log homepage data
  console.log('🏠 Homepage data check:', {
    allAnime,
    loading,
    error,
    trendingAnime: trendingAnime,
    trendingAnimeLength: trendingAnime.length,
    recentlyAdded: recentlyAdded,
    recentlyAddedLength: recentlyAdded.length,
    topRated: topRated,
    topRatedLength: topRated.length,
    searchResults: searchResults,
    searchResultsLength: searchResults.length,
    isSearching: isSearching
  });

  // Check if titles table is empty and populate if needed
  const checkAndPopulateDatabase = async () => {
    try {
      // Check if titles table has data
      const { count } = await supabase
        .from('titles')
        .select('*', { count: 'exact', head: true });
      
      if (count === 0) {
        // Titles table is empty, need to populate
        setIsPopulating(true);
        setPopulationStatus('Populating database with anime and manga data...');
        
        // Call the sync edge function using Supabase client
        const { data, error } = await supabase.functions.invoke('ultra-fast-complete-sync', {
          body: { 
            contentType: 'both',
            fullSync: true 
          }
        });
        
        if (error) {
          console.error('Population error:', error);
          setPopulationStatus('Failed to populate database: ' + error.message);
        } else if (data?.success) {
          setPopulationStatus(`Successfully populated ${data.totalProcessed || 'many'} titles!`);
          // Reload after 2 seconds to show the data
          setTimeout(() => window.location.reload(), 2000);
        } else {
          setPopulationStatus('Failed to populate database: ' + (data?.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Database check error:', error);
      setPopulationStatus('Error checking database: ' + (error as Error).message);
    } finally {
      setIsPopulating(false);
    }
  };
  
  // Database testing function
  const testDatabaseAccess = async () => {
    console.log('🧪 Starting comprehensive database test...');
    
    try {
      // Test 1: Simple count
      console.log('🧪 Test 1: Checking titles count...');
      const { count, error: countError } = await supabase
        .from('titles')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Titles count:', count, 'Error:', countError);
      
      // Test 2: Get some titles
      console.log('🧪 Test 2: Getting sample titles...');
      const { data: titles, error: titlesError } = await supabase
        .from('titles')
        .select('*')
        .limit(5);
      
      console.log('📋 Sample titles:', titles, 'Error:', titlesError);
      
      // Test 3: Get titles with anime details
      console.log('🧪 Test 3: Getting anime with details...');
      const { data: animeData, error: animeError } = await supabase
        .from('titles')
        .select('*, anime_details!inner(*)')
        .limit(5);
      
      console.log('🎬 Anime with details:', animeData, 'Error:', animeError);
      
      // Test 4: Get titles with manga details
      console.log('🧪 Test 4: Getting manga with details...');
      const { data: mangaData, error: mangaError } = await supabase
        .from('titles')
        .select('*, manga_details!inner(*)')
        .limit(5);
      
      console.log('📚 Manga with details:', mangaData, 'Error:', mangaError);
      
      // Test 5: Clear React Query cache
      console.log('🧪 Test 5: Clearing React Query cache...');
      queryClient.clear();
      console.log('✅ Cache cleared automatically');
      
      // Summary
      console.log('🎯 Database Test Summary:', {
        totalTitles: count,
        sampleTitlesCount: titles?.length || 0,
        animeWithDetailsCount: animeData?.length || 0,
        mangaWithDetailsCount: mangaData?.length || 0,
        errors: {
          count: countError?.message,
          titles: titlesError?.message,
          anime: animeError?.message,
          manga: mangaError?.message
        }
      });
      
    } catch (error) {
      console.error('❌ Database test failed:', error);
    }
  };

  // Run check on component mount
  useEffect(() => {
    checkAndPopulateDatabase();
  }, []);

  const handleAnimeClick = (anime: Anime) => {
    navigate(`/anime/${anime.id}`);
  };

  if (error) {
    console.error('❌ Home data error:', error);
  }

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
    <section className={`py-12 md:py-16 ${className}`}>
      <div className="container mx-auto mobile-safe-padding">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{subtitle}</p>
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
        
        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-[400px] bg-muted/20 animate-pulse rounded-lg" />
            ))}
          </div>
        }>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {animeList.map((anime) => (
              <div key={anime.id} className="group">
                <AnimeCard 
                  anime={anime} 
                  onClick={() => handleAnimeClick(anime)}
                  getDisplayName={getDisplayName}
                />
              </div>
            ))}
          </div>
        </Suspense>
      </div>
    </section>
  );

  if (loading || isPopulating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{isPopulating ? populationStatus || 'Setting up database...' : 'Loading anime...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Navigation />
      
      {/* Database Population Status */}
      {(isPopulating || populationStatus) && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-lg border border-primary/30 rounded-lg p-4 shadow-xl">
            <div className="flex items-center space-x-3">
              {isPopulating && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{populationStatus}</p>
                {isPopulating && (
                  <p className="text-xs text-muted-foreground mt-1">This may take a few moments...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show manual sync button if no data */}
      {trendingAnime.length === 0 && !isPopulating && !loading && (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">No Data Available</h3>
            <p className="text-muted-foreground mb-6">
              The database needs to be populated with anime and manga data.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={checkAndPopulateDatabase}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
                disabled={isPopulating}
              >
                Populate Database
              </button>
              <button
                onClick={testDatabaseAccess}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Test Database Access
              </button>
            </div>
          </div>
        </div>
      )}
      

      {/* Hero Section */}
      <Suspense fallback={
        <div className="h-[600px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }>
        <HeroSection />
      </Suspense>

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
      {searchResults.length === 0 && !isSearching && (trendingAnime.length > 0 || recentlyAdded.length > 0) && (
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
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto mobile-safe-padding text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8">
            Join the Ultimate <span className="text-accent">Ani</span><span className="text-primary">thing</span> Community
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">{formatCount(stats.animeCount)}</div>
              <div className="text-sm md:text-base text-muted-foreground">Anime Series</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-accent">{formatCount(stats.mangaCount)}</div>
              <div className="text-sm md:text-base text-muted-foreground">Manga Titles</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-secondary">{formatCount(stats.userCount)}</div>
              <div className="text-sm md:text-base text-muted-foreground">Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">24/7</div>
              <div className="text-sm md:text-base text-muted-foreground">Updates</div>
            </div>
          </div>
          <div className="mt-8 md:mt-12">
            <Button 
              variant="hero" 
              size="lg" 
              className="px-8 md:px-12 py-4 text-base md:text-lg"
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
