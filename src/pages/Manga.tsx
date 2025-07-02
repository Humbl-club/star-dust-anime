import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { useApiData } from "@/hooks/useApiData";
import { Navigation } from "@/components/Navigation";
import { InitialSyncTrigger } from "@/components/InitialSyncTrigger";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MangaCard = ({ manga }: { manga: Manga }) => (
  <Card className="group hover:shadow-glow-card transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm hover-scale">
    <CardContent className="p-0">
      <div className="relative overflow-hidden rounded-t-lg">
        <img 
          src={manga.image_url} 
          alt={manga.title}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Score Badge */}
        {manga.score && (
          <Badge className="absolute top-2 right-2 bg-primary/90 text-primary-foreground">
            <Star className="w-3 h-3 mr-1" />
            {manga.score}
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {manga.title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Badge variant="secondary" className="text-xs">
            {manga.type}
          </Badge>
          {manga.status && (
            <span className={`px-2 py-1 rounded text-xs ${
              manga.status === 'Publishing' ? 'bg-green-500/20 text-green-400' :
              manga.status === 'Finished' ? 'bg-blue-500/20 text-blue-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {manga.status}
            </span>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          {manga.chapters && (
            <div>Chapters: {manga.chapters}</div>
          )}
          {manga.volumes && (
            <div>Volumes: {manga.volumes}</div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mt-3">
          {manga.genres.slice(0, 2).map(genre => (
            <Badge key={genre} variant="outline" className="text-xs">
              {genre}
            </Badge>
          ))}
          {manga.genres.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{manga.genres.length - 2}
            </Badge>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

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
  const { data: mangaData, loading } = useApiData<Manga>({ 
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Discover Manga
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Explore thousands of manga series and novels. Dive into incredible stories.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Show loading message if no manga data yet */}
        {mangaData.length === 0 && (
          <div className="mb-8 text-center">
            <div className="bg-muted/20 rounded-lg p-8">
              <h3 className="text-lg font-semibold mb-2">Building Manga Database</h3>
              <p className="text-muted-foreground mb-4">
                Our system is automatically populating the manga database with trending titles from AniList and MyAnimeList. 
                This process runs in the background and should complete within a few minutes.
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
        {/* Search and Filters */}
        <Card className="mb-8 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search manga titles, descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
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
                    <SelectValue placeholder="All Genres" />
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
                    <SelectValue placeholder="All Status" />
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
                    <SelectValue placeholder="Sort By" />
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

        {/* Manga Grid */}
        {filteredManga.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredManga.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No manga found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or clear the filters.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
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