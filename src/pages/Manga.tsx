import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useInfiniteContentData } from "@/hooks/useInfiniteContentData";
import { InfiniteScrollContainer } from "@/components/InfiniteScrollContainer";
import { Grid3x3, List } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UnifiedSearchBar } from "@/components/UnifiedSearchBar";
import { AdvancedFiltering } from "@/components/features/AdvancedFiltering";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { LazyImage } from "@/components/ui/lazy-image";
import { 
  Search,
  Filter, 
  BookOpen,
  Star,
  Calendar
} from "lucide-react";
import { genres, mangaStatuses, type Manga } from "@/data/animeData";
import { useContentData } from "@/hooks/useContentData";
import { useSearchStore } from "@/store/searchStore";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";

const MangaCard = ({ manga }: { manga: Manga }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/manga/${manga.id}`);
  };

  return (
    <Card 
      className="anime-card group hover-scale cursor-pointer touch-friendly"
      onClick={handleClick}
    >
      <CardContent className="p-0">
      <div className="relative overflow-hidden rounded-t-lg">
        <LazyImage
          src={manga.image_url}
          alt={manga.title}
          className="w-full h-48 md:h-64"
          placeholderClassName="bg-gradient-to-br from-primary/20 to-accent/20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Score Badge */}
        {manga.score && (
          <Badge className="absolute top-2 right-2 glass-card border border-primary/20 glow-primary">
            <Star className="w-3 h-3 mr-1" />
            {manga.score}
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-gradient-primary transition-colors">
          {manga.title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{manga.type}</span>
          {manga.status && (
            <>
              <span>•</span>
              <span className={
                manga.status === 'Publishing' ? 'text-green-400' :
                manga.status === 'Finished' ? 'text-blue-400' :
                'text-yellow-400'
              }>
                {manga.status}
              </span>
            </>
          )}
          {manga.chapters && (
            <>
              <span>•</span>
              <span>{manga.chapters} ch</span>
            </>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
  );
};

const Manga = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredManga, setFilteredManga] = useState<Manga[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'pagination' | 'infinite'>('pagination');
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Use search store for state management
  const { query, filters, setFilters, setQuery } = useSearchStore();

  // Initialize filters from URL params
  useEffect(() => {
    const urlGenre = searchParams.get("genre");
    const urlStatus = searchParams.get("status");
    const urlSort = searchParams.get("sort");
    const urlSearch = searchParams.get("search");
    
    if (urlGenre || urlStatus || urlSort || urlSearch) {
      setFilters({
        contentType: 'manga',
        ...(urlGenre && urlGenre !== 'all' && { genre: urlGenre }),
        ...(urlStatus && urlStatus !== 'all' && { status: urlStatus }),
        sort_by: urlSort || 'popularity',
        order: 'desc'
      });
    }
  }, [searchParams, setFilters]);

  // Fetch manga data based on view mode
  const paginatedQuery = useContentData({ 
    contentType: 'manga',
    page: currentPage,
    limit: 24,
    search: query || undefined,
    genre: filters.genre !== 'all' ? filters.genre : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    sort_by: filters.sort_by || 'popularity',
    order: 'desc',
    useOptimized: true
  });

  const infiniteQuery = useInfiniteContentData({
    contentType: 'manga',
    limit: 24,
    search: query || undefined,
    genre: filters.genre !== 'all' ? filters.genre : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    sort_by: filters.sort_by || 'popularity',
    order: 'desc',
    useOptimized: true
  });

  // Use the appropriate query based on view mode
  const mangaData = viewMode === 'infinite' ? infiniteQuery.data : (paginatedQuery.data || []);
  const loading = viewMode === 'infinite' ? infiniteQuery.loading : paginatedQuery.loading;
  const error = viewMode === 'infinite' ? infiniteQuery.error : paginatedQuery.error;
  const pagination = viewMode === 'pagination' ? paginatedQuery.pagination : null;
  const syncFromExternal = paginatedQuery.syncFromExternal;

  // Debug logging for manga list fetching
  console.log('Manga.tsx: Fetching manga list with:', {
    functionName: 'anime-api (via useContentData)',
    payload: {
      contentType: 'manga',
      page: 1,
      limit: 1000,
          search: query,
          genre: filters.genre !== 'all' ? filters.genre : undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          sort_by: filters.sort_by || 'popularity',
      order: 'desc'
    },
    timestamp: new Date().toISOString()
  });

  // Log any errors
  if (error) {
    console.error('Manga.tsx: Error fetching manga list:', {
      error: error.message,
      stack: error.stack,
      status: (error as any).status || 'unknown',
      code: (error as any).code || 'unknown',
      fullError: error,
      timestamp: new Date().toISOString()
    });
  }

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (filters.genre && filters.genre !== "all") params.set("genre", filters.genre);
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.sort_by && filters.sort_by !== "popularity") params.set("sort", filters.sort_by);
    setSearchParams(params);
  }, [query, filters, setSearchParams]);

  // Extract authors from manga data for filtering
  useEffect(() => {
    if (mangaData.length > 0) {
      const authors = [...new Set(
        mangaData.flatMap(manga => manga.authors || []).filter(Boolean)
      )].sort();
      setAvailableAuthors(authors);
    }
  }, [mangaData]);

  // Update filtered manga when data changes
  useEffect(() => {
    setFilteredManga(mangaData);
  }, [mangaData]);

  const clearFilters = () => {
    setFilters({
      contentType: 'manga',
      sort_by: 'popularity',
      order: 'desc'
    });
  };

  const triggerMangaSync = async () => {
    setIsSyncing(true);
    try {
      await syncFromExternal(3); // Sync 3 pages like the original logic
      
      toast({
        title: "Manga Sync Complete!",
        description: "Successfully synced manga data from external sources.",
      });
    } catch (error: any) {
      console.error('Manga sync failed:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync manga data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Discover Manga - Anithing</title>
        <meta name="description" content="Explore thousands of manga series and novels. Find your next favorite manga with advanced search and filtering options." />
        <meta property="og:title" content="Discover Manga - Anithing" />
        <meta property="og:description" content="Explore thousands of manga series and novels. Find your next favorite manga with advanced search and filtering options." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Discover Manga - Anithing" />
        <meta name="twitter:description" content="Explore thousands of manga series and novels. Find your next favorite manga with advanced search and filtering options." />
      </Helmet>
      <Navigation />
      {/* Header */}
      <div className="relative py-20 mb-8">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="relative container mx-auto px-4">
          <div className="glass-card p-8 border border-primary/20 glow-primary">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-gradient-primary">
                Discover <span className="text-gradient-secondary">Manga</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Explore thousands of manga series and novels with <span className="text-gradient-primary font-semibold">Anithing</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto mobile-safe-padding py-6 md:py-8">
        {/* Results Summary and View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {viewMode === 'infinite' ? (
              <>Showing {infiniteQuery.currentItems} of {infiniteQuery.totalItems} manga</>
            ) : (
              <>Showing {((currentPage - 1) * 24) + 1} - {Math.min(currentPage * 24, pagination?.total || 0)} of {pagination?.total || 0} manga
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
              <BookOpen className="w-3 h-3 mr-1" />
              Manga
            </Badge>
            <Button 
              onClick={triggerMangaSync}
              disabled={isSyncing}
              variant="outline"
              size="sm"
            >
              {isSyncing ? "Syncing..." : "Sync Data"}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="anime-card mb-8 glow-card">
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <UnifiedSearchBar
                  contentType="manga"
                  placeholder="Search by title, author, or description..."
                  showDropdown={true}
                  onSearch={(searchQuery) => setQuery(searchQuery)}
                />
              </div>
              
              {/* Advanced Filters */}
              <AdvancedFiltering
                contentType="manga"
                availableGenres={genres}
                availableAuthors={availableAuthors}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Manga Grid */}
        {filteredManga.length > 0 ? (
          viewMode === 'infinite' ? (
            <InfiniteScrollContainer
              hasNextPage={infiniteQuery.hasNextPage}
              isFetchingNextPage={infiniteQuery.isFetchingNextPage}
              fetchNextPage={infiniteQuery.fetchNextPage}
              totalItems={infiniteQuery.totalItems}
              currentItems={infiniteQuery.currentItems}
              enableAutoLoad={true}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mb-8">
                {filteredManga.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            </InfiniteScrollContainer>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {filteredManga.map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
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
          <Card className="anime-card text-center py-12 glow-card">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center glow-primary">
                  <Search className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gradient-primary">No manga found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or clear the filters.
                  </p>
                  <Button variant="hero" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Manga;