import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, X, Save, RotateCcw, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore, useUIStore } from '@/store';

interface AdvancedFilteringProps {
  contentType: 'anime' | 'manga';
  availableGenres: string[];
  availableStudios?: string[];
}


const animeStatuses = [
  'Currently Airing',
  'Finished Airing',
  'Not Yet Aired',
  'Cancelled'
];

const mangaStatuses = [
  'Publishing',
  'Finished',
  'On Hiatus',
  'Cancelled',
  'Not Yet Published'
];

const animeTypes = [
  'TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'
];

const mangaTypes = [
  'Manga', 'Light Novel', 'One-shot', 'Doujinshi', 'Manhwa', 'Manhua'
];

const sortOptions = [
  { value: 'score', label: 'Rating' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'year', label: 'Year' },
  { value: 'title', label: 'Title' },
  { value: 'members', label: 'Members' },
  { value: 'favorites', label: 'Favorites' }
];

export function AdvancedFiltering({
  contentType,
  availableGenres,
  availableStudios = []
}: AdvancedFilteringProps) {
  const [presetName, setPresetName] = useState('');
  
  // Use stores instead of props
  const { query, filters, setFilters } = useSearchStore();
  const { modals, setModal } = useUIStore();
  
  const isOpen = modals.filterModal;
  const setIsOpen = (open: boolean) => setModal('filterModal', open);

  const statuses = contentType === 'anime' ? animeStatuses : mangaStatuses;
  const types = contentType === 'anime' ? animeTypes : mangaTypes;

  const updateFilter = (key: string, value: any) => {
    setFilters({ [key]: value });
  };

  const toggleGenre = (genre: string) => {
    // For simplicity, just toggle main genre filter
    const currentGenre = filters.genre;
    setFilters({ 
      genre: currentGenre === genre ? undefined : genre 
    });
  };

  const clearFilters = () => {
    setFilters({
      contentType: filters.contentType,
      sort_by: 'score',
      order: 'desc'
    });
  };

  const hasActiveFilters = Boolean(
    filters.genre || filters.status || filters.type || 
    filters.year || filters.season || filters.score_min || filters.score_max
  );

  const activeFiltersCount = [
    filters.genre && 1,
    filters.status && 1,
    filters.type && 1,
    filters.year && 1,
    filters.season && 1,
    (filters.score_min && filters.score_min > 0) && 1,
    (filters.score_max && filters.score_max < 10) && 1
  ].filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Filter className="w-4 h-4" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md overflow-hidden">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] pr-4">
          <div className="space-y-6 mt-6">
            {/* Score Range */}
            <div className="space-y-3">
              <Label>Minimum Score</Label>
              <div className="px-2">
                <Slider
                  min={0}
                  max={10}
                  step={0.1}
                  value={[filters.score_min || 0]}
                  onValueChange={(value) => updateFilter('score_min', value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>0</span>
                  <span>{filters.score_min || 0}</span>
                </div>
              </div>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                placeholder="e.g., 2023"
                value={filters.year || ''}
                onChange={(e) => updateFilter('year', e.target.value || undefined)}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any status</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filters.type || ''} onValueChange={(value) => updateFilter('type', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any type</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Sort by</Label>
                <Select value={filters.sort_by || 'score'} onValueChange={(value) => updateFilter('sort_by', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Select value={filters.order || 'desc'} onValueChange={(value) => updateFilter('order', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Genres */}
            <div className="space-y-3">
              <Label>Genre</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableGenres.map(genre => (
                  <Badge
                    key={genre}
                    variant={filters.genre === genre ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Season (for anime) */}
            {contentType === 'anime' && (
              <div className="space-y-2">
                <Label>Season</Label>
                <Select value={filters.season || ''} onValueChange={(value) => updateFilter('season', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any season</SelectItem>
                    <SelectItem value="Spring">Spring</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                    <SelectItem value="Fall">Fall</SelectItem>
                    <SelectItem value="Winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button onClick={() => setIsOpen(false)} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Default export for lazy loading
export default AdvancedFiltering;