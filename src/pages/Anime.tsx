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
  Star, 
  Calendar, 
  Play,
  Eye,
  Heart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApiData } from "@/hooks/useApiData";
import { useContentFilter } from "@/hooks/useContentFilter";
import { genres, animeStatuses, type Anime } from "@/data/animeData";
import { AnimeCard } from "@/components/AnimeCard";
import { Navigation } from "@/components/Navigation";
import { ContentRatingBadge } from "@/components/ContentRatingBadge";
import { LegalFooter } from "@/components/LegalFooter";

const Anime = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredAnime, setFilteredAnime] = useState<Anime[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "all");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "popularity");
  const [showFilters, setShowFilters] = useState(false);

  // Apple compliance - content filtering
  const { filterAnimeContent, getContentRating, isVerified } = useContentFilter();

  // Get anime data from API
  const { data: animeList, loading } = useApiData<Anime>({ 
    contentType: 'anime',
    limit: 100,
    sort_by: 'score',
    order: 'desc'
  });

  const handleAnimeClick = (anime: Anime) => {
    navigate(`/anime/${anime.id}`);
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedGenre !== "all") params.set("genre", selectedGenre);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (sortBy !== "popularity") params.set("sort", sortBy);
    setSearchParams(params);
  }, [searchQuery, selectedGenre, selectedStatus, sortBy, setSearchParams]);

  // Filter and sort anime with Apple compliance
  useEffect(() => {
    let filtered = [...animeList];

    // Apple Store compliance - Apply content filtering first
    if (isVerified) {
      filtered = filterAnimeContent(filtered);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(anime =>
        anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        anime.title_english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        anime.synopsis.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Genre filter (Apple compliant - excludes adult genres for restricted users)
    if (selectedGenre !== "all") {
      filtered = filtered.filter(anime =>
        anime.genres.some(genre => genre.toLowerCase() === selectedGenre.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(anime =>
        anime.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.score || 0) - (a.score || 0);
        case "year":
          return (b.year || 0) - (a.year || 0);
        case "title":
          return a.title.localeCompare(b.title);
        case "episodes":
          return (b.episodes || 0) - (a.episodes || 0);
        case "popularity":
        default:
          return (a.popularity || 999999) - (b.popularity || 999999);
      }
    });

    setFilteredAnime(filtered);
  }, [animeList, searchQuery, selectedGenre, selectedStatus, sortBy, filterAnimeContent, isVerified]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("all");
    setSelectedStatus("all");
    setSortBy("popularity");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Discover Anime
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Explore thousands of anime series and movies. Find your next favorite story.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-8 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by title, studio, or description..."
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
                    {animeStatuses.map(status => (
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
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="episodes">Episodes</SelectItem>
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
            Showing {filteredAnime.length} of {animeList.length} anime
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
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading anime...</p>
            </div>
          </div>
        ) : filteredAnime.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredAnime.map((anime) => (
              <AnimeCard 
                key={anime.id} 
                anime={anime} 
                onClick={() => handleAnimeClick(anime)}
              />
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
                  <h3 className="text-lg font-semibold mb-2">No anime found</h3>
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
      
      <LegalFooter />
    </div>
  );
};

export default Anime;