import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { 
  Filter, 
  Star, 
  Calendar, 
  Play,
  Eye,
  Heart,
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContentData } from "@/hooks/useContentData";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { useSearchStore } from "@/store";
import { genres, animeStatuses, type Anime } from "@/data/animeData";
import { AnimeCard } from "@/components/features/AnimeCard";
import { AnimeGridSkeleton } from "@/components/ui/AnimeCardSkeleton";
import { MobileOptimizedCard } from "@/components/MobileOptimizedCard";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Navigation } from "@/components/Navigation";
import { ContentRatingBadge } from "@/components/ContentRatingBadge";
import { SearchWithFilters } from "@/components/SearchWithFilters";
import { LegalFooter } from "@/components/LegalFooter";

const Anime = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredAnime, setFilteredAnime] = useState<Anime[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use search store for state management
  const { query, filters, setFilters } = useSearchStore();
  
  // Initialize filters from URL params
  useEffect(() => {
    const urlGenre = searchParams.get("genre");
    const urlStatus = searchParams.get("status");
    const urlSort = searchParams.get("sort");
    
    if (urlGenre || urlStatus || urlSort) {
      setFilters({
        contentType: 'anime',
        ...(urlGenre && urlGenre !== 'all' && { genre: urlGenre }),
        ...(urlStatus && urlStatus !== 'all' && { status: urlStatus }),
        sort_by: urlSort || 'score',
        order: 'desc'
      });
    }
  }, [searchParams, setFilters]);

  // Age verification
  const { isVerified } = useAgeVerification();

  // Get anime data from API using store filters with pagination
  const { data: animeResult, loading, refetch, error, pagination } = useContentData({ 
    contentType: 'anime',
    page: currentPage,
    limit: 24,
    search: query,
    genre: filters.genre,
    status: filters.status,
    type: filters.type,
    year: filters.year,
    season: filters.season,
    sort_by: filters.sort_by || 'score',
    order: filters.order || 'desc',
    useOptimized: true
  });

  const animeList = animeResult || [];

  // Debug logging for anime list fetching
  console.log('Anime.tsx: Fetching anime list with:', {
    functionName: 'anime-api (via useContentData)',
    payload: {
      contentType: 'anime',
      page: 1,
      limit: 100,
      search: query,
      genre: filters.genre,
      status: filters.status,
      type: filters.type,
      year: filters.year,
      season: filters.season,
      sort_by: filters.sort_by || 'score',
      order: filters.order || 'desc'
    },
    timestamp: new Date().toISOString()
  });

  // Log any errors
  if (error) {
    console.error('Anime.tsx: Error fetching anime list:', {
      error: error.message,
      stack: error.stack,
      status: (error as any).status || 'unknown',
      code: (error as any).code || 'unknown',
      fullError: error,
      timestamp: new Date().toISOString()
    });
  }

  const handleRefresh = async () => {
    await refetch();
  };

  const handleSearch = (searchQuery: string) => {
    // This will be handled by the SearchWithFilters component
  };

  const handleAnimeView = (anime: Anime) => {
    navigate(`/anime/${anime.id}`);
  };

  const handleAnimeClick = (anime: Anime) => {
    navigate(`/anime/${anime.id}`);
  };

  const handleAddToList = (animeId: string) => {
    // Navigate to anime detail page where AddToListButton handles the functionality
    navigate(`/anime/${animeId}`);
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (filters.genre) params.set("genre", filters.genre);
    if (filters.status) params.set("status", filters.status);
    if (filters.sort_by && filters.sort_by !== "score") params.set("sort", filters.sort_by);
    setSearchParams(params);
  }, [query, filters, setSearchParams]);

  // Set filtered anime directly from API data
  useEffect(() => {
    setFilteredAnime(animeList);
  }, [animeList]);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Discover Anime - Anithing</title>
        <meta name="description" content="Explore thousands of anime series and movies. Find your next favorite story with advanced search and filtering options." />
        <meta property="og:title" content="Discover Anime - Anithing" />
        <meta property="og:description" content="Explore thousands of anime series and movies. Find your next favorite story with advanced search and filtering options." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Discover Anime - Anithing" />
        <meta name="twitter:description" content="Explore thousands of anime series and movies. Find your next favorite story with advanced search and filtering options." />
      </Helmet>
      <Navigation />
      {/* Header */}
      <div className="relative py-20 mb-8">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="relative container mx-auto px-4">
          <div className="glass-card p-8 border border-primary/20 glow-primary">
            <div className="text-center">
              <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold mb-4 text-gradient-primary">
                Discover Anime
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
                Explore thousands of anime series and movies. Find your next favorite story.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-8 py-4">
        <PullToRefresh onRefresh={handleRefresh}>
        {/* Search and Filters */}
        <Card className="anime-card mb-8 glow-card">
          <CardHeader>
            <SearchWithFilters
              contentType="anime"
              availableGenres={genres}
              onSearch={handleSearch}
              placeholder="Search anime by title, studio, or description..."
            />
          </CardHeader>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing {((currentPage - 1) * 24) + 1} - {Math.min(currentPage * 24, pagination?.total || 0)} of {pagination?.total || 0} anime
            {pagination && ` (Page ${pagination.current_page} of ${pagination.total_pages})`}
          </p>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Play className="w-3 h-3 mr-1" />
              Anime
            </Badge>
          </div>
        </div>

        {/* Anime Grid */}
        {loading ? (
          <AnimeGridSkeleton count={24} />
        ) : filteredAnime.length > 0 ? (
          <>
            {/* Desktop Grid */}
            <div className="hidden lg:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAnime.map((anime) => (
                <AnimeCard 
                  key={anime.id} 
                  anime={anime} 
                  onClick={() => handleAnimeClick(anime)}
                />
              ))}
            </div>

            {/* Mobile Grid */}
            <div className="grid lg:hidden grid-cols-2 gap-3">
              {filteredAnime.map((anime) => (
                <MobileOptimizedCard
                  key={anime.id}
                  title={anime.title}
                  imageUrl={anime.image_url}
                  rating={anime.score}
                  year={anime.year}
                  genres={anime.genres}
                  status={anime.status}
                  onView={() => handleAnimeView(anime)}
                  onAddToList={() => handleAddToList(anime.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.total_pages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mb-8"
              />
            )}
          </>
        ) : (
          <Card className="anime-card text-center py-12 glow-card">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center glow-primary">
                  <Search className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gradient-primary">No anime found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or clear the filters.
                  </p>
                  <Button variant="hero" onClick={() => setFilters({ contentType: 'anime' })}>
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </PullToRefresh>
      </div>
      
      <LegalFooter />
    </div>
  );
};

export default Anime;