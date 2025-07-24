import { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Filter, X, Save, Upload, Trash2, MoreVertical, RotateCcw } from 'lucide-react';
import { useSearchStore, useUIStore } from '@/store';
import { useFilterPresets } from '@/hooks/useFilterPresets';
import { toast } from 'sonner';

interface AdvancedFilteringProps {
  contentType: 'anime' | 'manga';
  availableGenres: string[];
  availableStudios?: string[];
  availableAuthors?: string[];
}

interface FilterPreset {
  id: string;
  name: string;
  filters: any;
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
  availableStudios = [],
  availableAuthors = []
}: AdvancedFilteringProps) {
  const { presets, savePreset, loadPreset, deletePreset, isLoading: presetsLoading } = useFilterPresets(contentType);
  const [presetName, setPresetName] = useState('');
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedStudios, setSelectedStudios] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  
  // Use stores instead of props
  const { query, filters, setFilters } = useSearchStore();
  const { modals, setModal } = useUIStore();
  
  const isOpen = modals.filterModal;
  const setIsOpen = (open: boolean) => setModal('filterModal', open);

  const statuses = contentType === 'anime' ? animeStatuses : mangaStatuses;
  const types = contentType === 'anime' ? animeTypes : mangaTypes;

  // Load preset handler
  const handleLoadPreset = async (presetId: string) => {
    try {
      const preset = await loadPreset(presetId);
      const presetFilters = preset.filters as any;
      setFilters(presetFilters);
      setSelectedGenres(presetFilters.genres || []);
      setSelectedStudios(presetFilters.studios || []);
      setSelectedAuthors(presetFilters.authors || []);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to load preset:', error);
    }
  };

  // Save preset handler
  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    
    const filtersToSave = {
      ...filters,
      genres: selectedGenres,
      studios: selectedStudios,
      authors: selectedAuthors,
    };
    
    savePreset(presetName, filtersToSave);
    setPresetName('');
    setShowPresetDialog(false);
  };

  // Update filter function with enhanced logic
  const updateFilter = (key: string, value: any) => {
    setFilters({ [key]: value });
  };

  // Enhanced genre handling - multi-select
  const toggleGenre = (genre: string) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    
    setSelectedGenres(newGenres);
    setFilters({ genres: newGenres });
  };

  // Studio handling
  const toggleStudio = (studio: string) => {
    const newStudios = selectedStudios.includes(studio)
      ? selectedStudios.filter(s => s !== studio)
      : [...selectedStudios, studio];
    
    setSelectedStudios(newStudios);
    setFilters({ studios: newStudios });
  };

  // Author handling
  const toggleAuthor = (author: string) => {
    const newAuthors = selectedAuthors.includes(author)
      ? selectedAuthors.filter(a => a !== author)
      : [...selectedAuthors, author];
    
    setSelectedAuthors(newAuthors);
    setFilters({ authors: newAuthors });
  };

  const clearFilters = () => {
    setFilters({
      contentType: filters.contentType,
      sort_by: 'score',
      order: 'desc'
    });
    setSelectedGenres([]);
    setSelectedStudios([]);
    setSelectedAuthors([]);
  };

  // Calculate active filters count with enhanced logic
  const getActiveFiltersCount = () => {
    let count = 0;
    
    if (selectedGenres.length > 0) count++;
    if (selectedStudios.length > 0) count++;
    if (selectedAuthors.length > 0) count++;
    if (filters.status) count++;
    if (filters.type) count++;
    if (filters.year) count++;
    if (filters.season) count++;
    if (filters.score_min && filters.score_min > 0) count++;
    if (filters.score_max && filters.score_max < 10) count++;
    if (filters.year_min) count++;
    if (filters.year_max) count++;
    if (filters.episodes_min) count++;
    if (filters.episodes_max) count++;
    if (filters.chapters_min) count++;
    if (filters.chapters_max) count++;
    
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Initialize state on load
  useEffect(() => {
    // Load first preset if available
    if (presets.length > 0 && !activeFiltersCount) {
      handleLoadPreset(presets[0].id);
    }
  }, [presets]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Filter className="w-4 h-4" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
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
            {/* Filter Presets Section */}
            <div className="flex gap-2 pt-4">
              <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save Preset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Filter Preset</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="preset-name">Preset Name</Label>
                      <Input
                        id="preset-name"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Enter preset name..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSavePreset}>Save</Button>
                      <Button variant="outline" onClick={() => setShowPresetDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={presetsLoading || presets.length === 0}>
                    <Upload className="w-4 h-4 mr-2" />
                    Load Preset ({presets.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {presets.map((preset) => (
                    <DropdownMenuItem key={preset.id} className="flex items-center justify-between">
                      <span onClick={() => handleLoadPreset(preset.id)} className="flex-1 cursor-pointer">
                        {preset.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePreset(preset.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Score Range */}
            <div className="space-y-3">
              <Label>Score Range</Label>
              <div className="px-2 space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Minimum Score</Label>
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
                    <span>{(filters.score_min || 0).toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Maximum Score</Label>
                  <Slider
                    min={0}
                    max={10}
                    step={0.1}
                    value={[filters.score_max || 10]}
                    onValueChange={(value) => updateFilter('score_max', value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>0</span>
                    <span>{(filters.score_max || 10).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Year Range */}
            <div className="space-y-3">
              <Label>Year Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm text-muted-foreground">From</Label>
                  <Input
                    type="number"
                    placeholder="1960"
                    min="1960"
                    max="2030"
                    value={filters.year_min || ''}
                    onChange={(e) => updateFilter('year_min', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">To</Label>
                  <Input
                    type="number"
                    placeholder="2024"
                    min="1960"
                    max="2030"
                    value={filters.year_max || ''}
                    onChange={(e) => updateFilter('year_max', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            {/* Episode/Chapter Count Range */}
            {contentType === 'anime' ? (
              <div className="space-y-3">
                <Label>Episode Count Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Min Episodes</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      min="1"
                      value={filters.episodes_min || ''}
                      onChange={(e) => updateFilter('episodes_min', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Max Episodes</Label>
                    <Input
                      type="number"
                      placeholder="999"
                      min="1"
                      value={filters.episodes_max || ''}
                      onChange={(e) => updateFilter('episodes_max', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Chapter Count Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">Min Chapters</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      min="1"
                      value={filters.chapters_min || ''}
                      onChange={(e) => updateFilter('chapters_min', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Max Chapters</Label>
                    <Input
                      type="number"
                      placeholder="999"
                      min="1"
                      value={filters.chapters_max || ''}
                      onChange={(e) => updateFilter('chapters_max', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            )}

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

            {/* Genres - Multi-select with checkboxes */}
            <div className="space-y-3">
              <Label>Genres ({selectedGenres.length} selected)</Label>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {availableGenres.map(genre => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={`genre-${genre}`}
                        checked={selectedGenres.includes(genre)}
                        onCheckedChange={() => toggleGenre(genre)}
                      />
                      <Label htmlFor={`genre-${genre}`} className="text-sm cursor-pointer">
                        {genre}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Studios (anime only) */}
            {contentType === 'anime' && availableStudios.length > 0 && (
              <div className="space-y-3">
                <Label>Studios ({selectedStudios.length} selected)</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {availableStudios.map(studio => (
                      <div key={studio} className="flex items-center space-x-2">
                        <Checkbox
                          id={`studio-${studio}`}
                          checked={selectedStudios.includes(studio)}
                          onCheckedChange={() => toggleStudio(studio)}
                        />
                        <Label htmlFor={`studio-${studio}`} className="text-sm cursor-pointer">
                          {studio}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Authors (manga only) */}
            {contentType === 'manga' && availableAuthors.length > 0 && (
              <div className="space-y-3">
                <Label>Authors ({selectedAuthors.length} selected)</Label>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {availableAuthors.map(author => (
                      <div key={author} className="flex items-center space-x-2">
                        <Checkbox
                          id={`author-${author}`}
                          checked={selectedAuthors.includes(author)}
                          onCheckedChange={() => toggleAuthor(author)}
                        />
                        <Label htmlFor={`author-${author}`} className="text-sm cursor-pointer">
                          {author}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

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
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={activeFiltersCount === 0}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Apply Filters ({activeFiltersCount} active)
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