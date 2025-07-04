import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Timer, 
  Search, 
  Filter, 
  Play, 
  BookOpen,
  Clock,
  Calendar,
  RefreshCw,
  Settings
} from "lucide-react";
import { CountdownDisplay } from "./CountdownDisplay";
import { countdownService, CountdownData } from "@/services/countdownService";
import { useApiData } from "@/hooks/useApiData";
import { type Anime } from "@/data/animeData";

interface CountdownGridProps {
  maxItems?: number;
  showSearch?: boolean;
  showFilter?: boolean;
  autoRefresh?: boolean;
  className?: string;
}

export const CountdownGrid = ({ 
  maxItems = 12,
  showSearch = true,
  showFilter = true,
  autoRefresh = true,
  className = ""
}: CountdownGridProps) => {
  const [countdowns, setCountdowns] = useState<CountdownData[]>([]);
  const [filteredCountdowns, setFilteredCountdowns] = useState<CountdownData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'anime' | 'manga'>('all');
  const [loading, setLoading] = useState(true);

  // Get anime/manga data
  const { data: animeData } = useApiData<Anime>({ 
    contentType: 'anime',
    limit: 100,
    autoFetch: true
  });

  // Generate countdowns from data
  useEffect(() => {
    const generateCountdowns = () => {
      const newCountdowns: CountdownData[] = [];

      // Generate anime countdowns
      animeData.forEach(anime => {
        const countdown = countdownService.createAnimeCountdown(anime);
        if (countdown && countdown.status !== 'finished') {
          newCountdowns.push(countdown);
        }
      });

      // Sort by release date
      newCountdowns.sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());

      setCountdowns(newCountdowns.slice(0, maxItems));
      setLoading(false);
    };

    if (animeData.length > 0) {
      generateCountdowns();
    }
  }, [animeData, maxItems]);

  // Filter countdowns based on search and type
  useEffect(() => {
    let filtered = countdowns;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(countdown => countdown.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(countdown => 
        countdown.title.toLowerCase().includes(query)
      );
    }

    setFilteredCountdowns(filtered);
  }, [countdowns, searchQuery, filterType]);

  const handleRefresh = () => {
    setLoading(true);
    // Trigger data refresh
    window.location.reload();
  };

  const getTypeIcon = (type: 'anime' | 'manga') => {
    return type === 'anime' ? <Play className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />;
  };

  const getTypeColor = (type: 'anime' | 'manga') => {
    return type === 'anime' ? 'text-primary' : 'text-secondary';
  };

  if (loading) {
    return (
      <Card className={`border-primary/20 ${className}`}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mr-3" />
            <span>Loading countdowns...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            Release Countdowns
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filteredCountdowns.length} active
            </Badge>
            
            {autoRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-8 w-8 p-0"
                title="Refresh countdowns"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search and Filter Controls */}
        {(showSearch || showFilter) && (
          <div className="flex flex-col sm:flex-row gap-4">
            {showSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search countdowns..."
                  className="pl-10"
                />
              </div>
            )}
            
            {showFilter && (
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'anime' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('anime')}
                  className="flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Anime
                </Button>
                <Button
                  variant={filterType === 'manga' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('manga')}
                  className="flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" />
                  Manga
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Countdown Grid */}
        {filteredCountdowns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCountdowns.map((countdown, index) => (
              <div 
                key={countdown.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CountdownDisplay 
                  countdown={countdown}
                  showNotifications={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Active Countdowns</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 
                'No countdowns match your search.' : 
                'No upcoming releases found. Check back later!'}
            </p>
            
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}

        {/* Stats Footer */}
        {filteredCountdowns.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {filteredCountdowns.filter(c => c.type === 'anime').length} anime
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {filteredCountdowns.filter(c => c.type === 'manga').length} manga
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Auto-updating</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};