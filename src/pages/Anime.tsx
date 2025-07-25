import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { 
  Filter, 
  Star, 
  Calendar, 
  Play,
  Eye,
  Heart,
  Search,
  Grid3x3,
  List,
  RefreshCw,
  AlertCircle,
  BookOpen,
  X,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContentData } from "@/hooks/useContentData";
import { useInfiniteContentData } from "@/hooks/useInfiniteContentData";
import { InfiniteScrollContainer } from "@/components/InfiniteScrollContainer";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { useSearchStore } from "@/store";
import { genres, animeStatuses, type Anime } from "@/data/animeData";
import { AnimeCard } from "@/components/features/AnimeCard";
import { AnimeGridSkeleton } from "@/components/ui/AnimeCardSkeleton";
import { MobileOptimizedCard } from "@/components/MobileOptimizedCard";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Navigation } from "@/components/Navigation";
import { ContentRatingBadge } from "@/components/ContentRatingBadge";
import { UnifiedSearchBar } from "@/components/UnifiedSearchBar";
import { AdvancedFiltering } from "@/components/features/AdvancedFiltering";
import { LegalFooter } from "@/components/LegalFooter";
import { logger } from "@/utils/logger";
import { toast } from "sonner";

const Anime = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredAnime, setFilteredAnime] = useState<Anime[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'pagination' | 'infinite'>('pagination');
  const [availableStudios, setAvailableStudios] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Use search store for state management
  const { query, filters, setFilters, setQuery } = useSearchStore();
  
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

  // Get anime data based on view mode
  const paginatedQuery = useContentData({ 
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

  const infiniteQuery = useInfiniteContentData({
    contentType: 'anime',
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

  // Use the appropriate query based on view mode
  const animeList = viewMode === 'infinite' ? infiniteQuery.data : (paginatedQuery.data || []);
  const loading = viewMode === 'infinite' ? infiniteQuery.loading : paginatedQuery.loading;
  const error = viewMode === 'infinite' ? infiniteQuery.error : paginatedQuery.error;
  const pagination = viewMode === 'pagination' ? paginatedQuery.pagination : null;

  // Debug logging for anime list fetching
  logger.debug('Anime.tsx: Fetching anime list with:', {
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

  // Add comprehensive error handling
  useEffect(() => {
    if (error) {
      console.error('Error fetching anime data:', error);
      toast.error("Error loading anime", {
        description: error.message || "Failed to load anime. Please try refreshing the page.",
        duration: 5000
      });
    }
  }, [error]);

  // Calculate if we have data to display
  const hasData = viewMode === 'infinite' 
    ? infiniteQuery.data && infiniteQuery.data.length > 0
    : paginatedQuery.data && paginatedQuery.data.length > 0;

  // Log data state for debugging
  useEffect(() => {
    logger.debug('Anime page data state:', {
      hasData,
      loading,
      error,
      dataLength: viewMode === 'infinite' ? infiniteQuery.data?.length : paginatedQuery.data?.length,
      viewMode
    });
  }, [hasData, loading, error, viewMode]);

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
    if (viewMode === 'infinite') {
      await infiniteQuery.refetch();
    } else {
      await paginatedQuery.refetch();
    }
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

  // Sync function placeholder (to be replaced with actual sync implementation)
  const syncFromExternal = async (page: number) => {
    // This would typically sync from AniList or other sources
    throw new Error("Sync functionality not implemented yet");
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

  // Extract studios from anime data for filtering
  useEffect(() => {
    if (animeList.length > 0) {
      const studios = [...new Set(
        animeList.flatMap(anime => anime.studios || []).filter(Boolean)
      )].sort();
      setAvailableStudios(studios);
    }
  }, [animeList]);

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
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <UnifiedSearchBar
                  placeholder="Search anime..."
                  showDropdown={true}
                  contentType="anime"
                  className="flex-1"
                  onSearch={(query) => {
                    setQuery(query);
                    if (query) {
                      searchParams.set('search', query);
                      setSearchParams(searchParams);
                    } else {
                      searchParams.delete('search');
                      setSearchParams(searchParams);
                    }
                  }}
                />
              </div>
              
              {/* Advanced Filters */}
              <AdvancedFiltering
                contentType="anime"
                availableGenres={genres}
                availableStudios={['Madhouse', 'Bones', 'Wit Studio', 'A-1 Pictures', 'Ufotable']}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Results Summary and View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {viewMode === 'infinite' ? (
              <>Showing {infiniteQuery.currentItems} of {infiniteQuery.totalItems} anime</>
            ) : (
              <>Showing {((currentPage - 1) * 24) + 1} - {Math.min(currentPage * 24, pagination?.total || 0)} of {pagination?.total || 0} anime
              {pagination && ` (Page ${pagination.current_page} of ${pagination.total_pages})`}</>
            )}
          </p>
          
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                variant={viewMode === 'pagination' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('pagination')}
                className="rounded-none"
              >
                <Grid3x3 className="w-4 h-4 mr-1" />
                Pages
              </Button>
              <Button
                variant={viewMode === 'infinite' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('infinite')}
                className="rounded-none"
              >
                <List className="w-4 h-4 mr-1" />
                Infinite
              </Button>
            </div>
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
          viewMode === 'infinite' ? (
            <InfiniteScrollContainer
              hasNextPage={infiniteQuery.hasNextPage}
              isFetchingNextPage={infiniteQuery.isFetchingNextPage}
              fetchNextPage={infiniteQuery.fetchNextPage}
              totalItems={infiniteQuery.totalItems}
              currentItems={infiniteQuery.currentItems}
              enableAutoLoad={true}
            >
              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
                {filteredAnime.map((anime) => (
                  <AnimeCard 
                    key={anime.id} 
                    anime={anime} 
                    onClick={() => handleAnimeClick(anime)}
                  />
                ))}
              </div>

              {/* Mobile Grid */}
              <div className="grid lg:hidden grid-cols-2 gap-3 mb-8">
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
            </InfiniteScrollContainer>
          ) : (
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
          )
        ) : (
          <>
            {/* Empty State */}
            {!loading && !hasData && !error && (
          <div className="container mx-auto py-8">
            <Card className="p-8 text-center max-w-2xl mx-auto">
              <CardContent className="space-y-4">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">No Anime Found</h3>
                <p className="text-muted-foreground text-lg">
                  {query 
                    ? `No results found for "${query}". Try adjusting your filters or search terms.`
                    : filters.genre || filters.status || filters.type
                      ? "No anime matches your current filters. Try adjusting them."
                      : "No anime available at the moment. The database might be syncing."}
                </p>
                <div className="flex gap-3 justify-center">
                  {(filters.genre || filters.status || filters.type || query) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({
                          contentType: 'anime',
                          sort_by: 'score',
                          order: 'desc'
                        });
                        setQuery('');
                        setSearchParams({});
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    onClick={async () => {
                      setIsSyncing(true);
                      try {
                        await syncFromExternal(1);
                        toast.success("Sync started", {
                          description: "Fetching latest anime data...",
                        });
                      } catch (error) {
                        toast.error("Sync failed", {
                          description: "Could not sync data. Please try again.",
                        });
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync from AniList
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
            )}

            {/* Error State */}
            {error && !loading && (
          <div className="container mx-auto py-8">
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <strong>Error loading anime:</strong> {error.message || 'An unexpected error occurred'}
                <Button
                  variant="link"
                  className="ml-4 p-0 h-auto"
                  onClick={() => window.location.reload()}
                >
                  Try refreshing the page
                </Button>
              </AlertDescription>
            </Alert>
          </div>
            )}
          </>
        )}
        </PullToRefresh>
      </div>
      
      <LegalFooter />
    </div>
  );
};

export default Anime;