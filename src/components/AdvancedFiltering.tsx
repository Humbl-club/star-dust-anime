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

export interface FilterOptions {
  search: string;
  genres: string[];
  excludeGenres: string[];
  scoreRange: [number, number];
  year: string;
  status: string;
  type: string;
  rating: string;
  studios: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFilteringProps {
  contentType: 'anime' | 'manga';
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableGenres: string[];
  availableStudios?: string[];
  savedPresets?: FilterPreset[];
  onSavePreset?: (name: string, filters: FilterOptions) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
  onDeletePreset?: (id: string) => void;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterOptions;
  contentType: 'anime' | 'manga';
  createdAt: string;
}

const defaultFilters: FilterOptions = {
  search: '',
  genres: [],
  excludeGenres: [],
  scoreRange: [0, 10],
  year: '',
  status: '',
  type: '',
  rating: '',
  studios: [],
  sortBy: 'score',
  sortOrder: 'desc'
};

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
  filters,
  onFiltersChange,
  availableGenres,
  availableStudios = [],
  savedPresets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset
}: AdvancedFilteringProps) {
  const [presetName, setPresetName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const statuses = contentType === 'anime' ? animeStatuses : mangaStatuses;
  const types = contentType === 'anime' ? animeTypes : mangaTypes;

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleGenre = (genre: string, exclude = false) => {
    const targetArray = exclude ? filters.excludeGenres : filters.genres;
    const otherArray = exclude ? filters.genres : filters.excludeGenres;
    const key = exclude ? 'excludeGenres' : 'genres';
    const otherKey = exclude ? 'genres' : 'excludeGenres';

    // Remove from other array if present
    const updatedOtherArray = otherArray.filter(g => g !== genre);
    
    // Toggle in target array
    const updatedTargetArray = targetArray.includes(genre)
      ? targetArray.filter(g => g !== genre)
      : [...targetArray, genre];

    onFiltersChange({
      ...filters,
      [key]: updatedTargetArray,
      [otherKey]: updatedOtherArray
    });
  };

  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(defaultFilters);

  const saveCurrentPreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
    }
  };

  const activeFiltersCount = [
    filters.search && 1,
    filters.genres.length,
    filters.excludeGenres.length,
    filters.year && 1,
    filters.status && 1,
    filters.type && 1,
    filters.rating && 1,
    filters.studios.length,
    (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 10) && 1
  ].filter(Boolean).reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);

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
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder={`Search ${contentType}...`}
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>

            {/* Score Range */}
            <div className="space-y-3">
              <Label>Score Range</Label>
              <div className="px-2">
                <Slider
                  min={0}
                  max={10}
                  step={0.1}
                  value={filters.scoreRange}
                  onValueChange={(value) => updateFilter('scoreRange', value)}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>{filters.scoreRange[0]}</span>
                  <span>{filters.scoreRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                placeholder="e.g., 2023"
                value={filters.year}
                onChange={(e) => updateFilter('year', e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
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
              <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
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
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
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
                <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value)}>
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
              <Label>Include Genres</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableGenres.map(genre => (
                  <Badge
                    key={genre}
                    variant={filters.genres.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => toggleGenre(genre, false)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Exclude Genres */}
            <div className="space-y-3">
              <Label>Exclude Genres</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableGenres.map(genre => (
                  <Badge
                    key={genre}
                    variant={filters.excludeGenres.includes(genre) ? "destructive" : "outline"}
                    className="cursor-pointer hover:bg-destructive/80"
                    onClick={() => toggleGenre(genre, true)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Studios (for anime) */}
            {contentType === 'anime' && availableStudios.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label>Studios</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availableStudios.map(studio => (
                      <Badge
                        key={studio}
                        variant={filters.studios.includes(studio) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => {
                          const updatedStudios = filters.studios.includes(studio)
                            ? filters.studios.filter(s => s !== studio)
                            : [...filters.studios, studio];
                          updateFilter('studios', updatedStudios);
                        }}
                      >
                        {studio}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Saved Presets */}
            {savedPresets.length > 0 && (
              <div className="space-y-3">
                <Label>Saved Presets</Label>
                <div className="space-y-2">
                  {savedPresets
                    .filter(preset => preset.contentType === contentType)
                    .map(preset => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 justify-start"
                          onClick={() => onLoadPreset?.(preset)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {preset.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeletePreset?.(preset.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Save Preset */}
            {onSavePreset && (
              <div className="space-y-3">
                <Label>Save Current Filters</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={saveCurrentPreset}
                    disabled={!presetName.trim()}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
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