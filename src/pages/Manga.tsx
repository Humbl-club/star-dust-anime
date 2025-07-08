import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  BookOpen,
  Star,
  Calendar
} from "lucide-react";
import { genres, mangaStatuses, type Manga } from "@/data/animeData";
import { useSimpleNewApiData } from "@/hooks/useSimpleNewApiData";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
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
        <img 
          src={manga.image_url} 
          alt={manga.title}
          className="w-full h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
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
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "all");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "popularity");
  const [showFilters, setShowFilters] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Fetch manga data from database
  const { data: mangaData, loading } = useSimpleNewApiData({ 
    contentType: 'manga',
    limit: 1000,
    search: searchQuery || undefined,
    genre: selectedGenre !== 'all' ? selectedGenre : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    sort_by: sortBy,
    order: 'desc'
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedGenre !== "all") params.set("genre", selectedGenre);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (sortBy !== "popularity") params.set("sort", sortBy);
    setSearchParams(params);
  }, [searchQuery, selectedGenre, selectedStatus, sortBy, setSearchParams]);

  // Update filtered manga when data changes
  useEffect(() => {
    setFilteredManga(mangaData);
  }, [mangaData]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("all");
    setSelectedStatus("all");
    setSortBy("popularity");
  };

  const triggerMangaSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-content-sync', {
        body: { 
          contentType: 'manga',
          operation: 'full_sync',
          page: 1 
        }
      });

      if (error) throw error;
      
      toast({
        title: "Manga Sync Started!",
        description: "Fetching trending manga from AniList and MAL. This will take a few minutes.",
      });

      // Trigger additional pages
      for (let page = 2; page <= 3; page++) {
        setTimeout(() => {
          supabase.functions.invoke('intelligent-content-sync', {
            body: { 
              contentType: 'manga',
              operation: 'full_sync',
              page 
            }
          });
        }, page * 2000); // Stagger the requests
      }

    } catch (error: any) {
      console.error('Manga sync failed:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to start manga sync. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen">
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
        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing {filteredManga.length} of {mangaData.length} manga
          </p>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              Manga
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="anime-card mb-8 glow-card">
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by title, author, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass-input"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Filters */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Browse all genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {mangaStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by popularity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="chapters">Chapters</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Manga Grid - Mobile Optimized */}
        {filteredManga.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredManga.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
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