import { useState, useRef, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useAuth } from "@/hooks/useAuth";
import { useUserLists } from "@/hooks/useUserLists";
import { useApiData } from "@/hooks/useApiData";
import { useFillerData } from "@/hooks/useFillerData";
import { useConsolidatedSearch } from "@/hooks/useConsolidatedSearch";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useBulkOperations } from "@/hooks/useBulkOperations";
import { FillerToggle } from "@/components/FillerToggle";
import { FillerIndicator } from "@/components/FillerIndicator";
import { AnimeListItem } from "@/components/AnimeListItem";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { VirtualizedList } from "@/components/VirtualizedList";
import { DragDropListItem } from "@/components/DragDropListItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RatingComponent } from "@/components/RatingComponent";
import { AddToListButton } from "@/components/AddToListButton";
import { Navigation } from "@/components/Navigation";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';

import { useToast } from "@/hooks/use-toast";
import { listStatuses, type Anime, type Manga } from "@/data/animeData";
import { 
  Search,
  Filter,
  Play, 
  BookOpen, 
  Star,
  Calendar,
  Check,
  Clock,
  Pause,
  X,
  Eye,
  Edit,
  Trash2,
  Heart,
  Mail,
  Sparkles
} from "lucide-react";

const MyLists = () => {
  const { user } = useAuth();
  const { canUseFeature } = useEmailVerification();
  const { 
    animeList, 
    mangaList, 
    loading: userListsLoading,
    updateAnimeListEntry,
    updateMangaListEntry,
    removeFromAnimeList,
    removeFromMangaList
  } = useUserLists();
  
  const [activeTab, setActiveTab] = useState("anime");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hideFillerContent, setHideFillerContent] = useState(false);
  const [useVirtualization, setUseVirtualization] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search handler
  const debouncedSetSearchQuery = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 300);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bulk operations
  const bulkOperations = useBulkOperations();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch anime and manga data from database
  const { data: animeData, loading: animeLoading } = useApiData<Anime>({ 
    contentType: 'anime',
    limit: 1000 
  });
  
  const { data: mangaData, loading: mangaLoading } = useApiData<Manga>({ 
    contentType: 'manga',
    limit: 1000 
  });

  // Get anime/manga details from database data
  const getAnimeDetails = (animeId: string) => {
    return animeData.find(anime => anime.id === animeId);
  };

  const getMangaDetails = (mangaId: string) => {
    return mangaData.find(manga => manga.id === mangaId);
  };

  // Get enhanced anime/manga data for search using normalized schema
  const enhancedAnimeList = animeList.map(entry => ({
    ...entry,
    title: entry.anime_details?.titles?.title || 'Unknown Title',
    title_english: entry.anime_details?.titles?.title_english,
    title_japanese: entry.anime_details?.titles?.title_japanese,
    image_url: entry.anime_details?.titles?.image_url,
    id: entry.anime_details?.titles?.anilist_id?.toString() || entry.id,
  })).filter(item => item.title && item.title !== 'Unknown Title');

  const enhancedMangaList = mangaList.map(entry => ({
    ...entry,
    title: entry.manga_details?.titles?.title || 'Unknown Title',
    title_english: entry.manga_details?.titles?.title_english,
    title_japanese: entry.manga_details?.titles?.title_japanese,
    image_url: entry.manga_details?.titles?.image_url,
    id: entry.manga_details?.titles?.anilist_id?.toString() || entry.id,
  })).filter(item => item.title && item.title !== 'Unknown Title');

  // Filter by search query
  const searchedAnimeList = enhancedAnimeList.filter(item => 
    !searchQuery || 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title_english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title_japanese?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const searchedMangaList = enhancedMangaList.filter(item => 
    !searchQuery || 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title_english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title_japanese?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by status
  const filteredAnimeList = searchedAnimeList.filter(entry => 
    statusFilter === "all" || entry.status === statusFilter
  );

  const filteredMangaList = searchedMangaList.filter(entry => 
    statusFilter === "all" || entry.status === statusFilter
  );

  const statusIcons = {
    watching: Play,
    reading: Eye,
    completed: Check,
    on_hold: Pause,
    dropped: X,
    plan_to_watch: Clock,
    plan_to_read: Clock
  };

  const statusColors = {
    watching: "bg-green-500",
    reading: "bg-green-500", 
    completed: "bg-blue-500",
    on_hold: "bg-yellow-500",
    dropped: "bg-red-500",
    plan_to_watch: "bg-gray-500",
    plan_to_read: "bg-gray-500"
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onToggleView: () => setUseVirtualization(!useVirtualization),
    onSelectAll: () => {
      const currentList = activeTab === 'anime' ? filteredAnimeList : filteredMangaList;
      bulkOperations.selectAll(currentList);
    },
    onClearSelection: bulkOperations.clearSelection,
    onRefresh: () => {
      animeData && mangaData && window.location.reload();
    },
    onToggleFilters: () => setShowFilters(!showFilters),
    enabledScopes: ['lists']
  });

  // Drag and drop handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // Handle reordering logic here
      // For now, just a placeholder since we'd need to implement custom ordering in the backend
      console.log('Reorder:', active.id, 'to', over?.id);
    }
  }, []);

  // Bulk operations handlers
  const handleBulkStatusUpdate = (status: string) => {
    const updateFn = activeTab === 'anime' ? updateAnimeListEntry : updateMangaListEntry;
    bulkOperations.bulkUpdateStatus(status, updateFn);
  };

  const handleBulkRatingUpdate = (rating: number) => {
    const updateFn = activeTab === 'anime' ? updateAnimeListEntry : updateMangaListEntry;
    bulkOperations.bulkUpdateRating(rating, updateFn);
  };

  const handleBulkDelete = () => {
    const deleteFn = activeTab === 'anime' ? removeFromAnimeList : removeFromMangaList;
    bulkOperations.bulkDelete(deleteFn);
  };

  // Render list item
  const renderAnimeListItem = useCallback((entry: any, index: number) => {
    // Use data from normalized schema in enhancedAnimeList
    const anime: Anime = {
      id: entry.id,
      title: entry.title,
      title_english: entry.title_english,
      title_japanese: entry.title_japanese,
      image_url: entry.image_url,
      synopsis: '',
      type: 'TV',
      episodes: undefined,
      status: 'Finished Airing',
      genres: []
    };
    if (!anime.title) return null;
    
    const StatusIcon = statusIcons[entry.status as keyof typeof statusIcons];
    const statusColor = statusColors[entry.status as keyof typeof statusColors];
    const statusLabel = listStatuses.anime.find(s => s.value === entry.status)?.label || '';
    
    return (
      <DragDropListItem
        key={entry.id}
        id={entry.id}
        isSelected={bulkOperations.isSelected(entry.id)}
        onSelect={(selected) => {
          if (selected) {
            bulkOperations.selectItem(entry.id);
          } else {
            bulkOperations.deselectItem(entry.id);
          }
        }}
        className="mb-4"
      >
        <AnimeListItem
          entry={entry}
          anime={anime}
          onUpdate={updateAnimeListEntry}
          StatusIcon={StatusIcon}
          statusColor={statusColor}
          statusLabel={statusLabel}
          hideFillerContent={hideFillerContent}
        />
      </DragDropListItem>
    );
  }, [bulkOperations, hideFillerContent, updateAnimeListEntry, statusIcons, statusColors]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
            <p className="text-muted-foreground">You need to be signed in to view your lists.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canUseFeature('my_lists')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <Card className="max-w-md mx-4 glass-card border-primary/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-10" />
          <CardContent className="relative p-8 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 glass-card border-primary/20 rounded-full flex items-center justify-center">
                  <Heart className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-accent-foreground animate-bounce" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gradient-primary">Unlock Your Lists!</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Verify your email to save your progress and access your personalized anime & manga collection.
                </p>
                <div className="space-y-3">
                  <Button 
                    className="w-full glass-button gradient-primary hover:glow-primary transition-all duration-300 transform hover:scale-105"
                    onClick={() => window.location.href = '/'}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Verify Email & Continue
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full hover:bg-muted/20"
                    onClick={() => window.location.href = '/'}
                  >
                    Return Home
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userListsLoading || animeLoading || mangaLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      <EmailVerificationBanner />
      {/* Header with animated background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-accent text-primary-foreground pt-24 pb-12">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat bg-center" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                My Lists
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
                Manage your anime and manga collections. Track your progress and ratings.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Search and Filters */}
        <Card className="mb-8 border-border/30 bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-lg shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Find something in your collection... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => debouncedSetSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-background/50 border-border/50">
                  <SelectValue placeholder="Show all statuses" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-md border-border/50">
                  <SelectItem value="all">All Status</SelectItem>
                  {activeTab === "anime" 
                    ? listStatuses.anime.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))
                    : listStatuses.manga.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseVirtualization(!useVirtualization)}
                  className="text-xs bg-background/50 border-border/50 hover:bg-primary/10"
                >
                  {useVirtualization ? 'Grid View' : 'Virtual View'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkOperations.toggleSelectAll(
                    activeTab === 'anime' ? filteredAnimeList : filteredMangaList
                  )}
                  className="text-xs bg-background/50 border-border/50 hover:bg-primary/10"
                >
                  {bulkOperations.selectedCount > 0 ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Lists */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="anime" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Anime ({animeList.length})
            </TabsTrigger>
            <TabsTrigger value="manga" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Manga ({mangaList.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anime">
            {filteredAnimeList.length > 0 && (
              <div className="mb-4">
                <FillerToggle
                  hideFillerContent={hideFillerContent}
                  onToggle={setHideFillerContent}
                />
              </div>
            )}
            
            {filteredAnimeList.length > 0 ? (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
              >
                <SortableContext 
                  items={filteredAnimeList.map(entry => entry.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {useVirtualization ? (
                    <VirtualizedList
                      items={filteredAnimeList}
                      renderItem={renderAnimeListItem}
                      itemHeight={280}
                      containerHeight={600}
                      className="space-y-4"
                    />
                  ) : (
                    <div className="space-y-4">
                      {filteredAnimeList.map((entry, index) => renderAnimeListItem(entry, index))}
                    </div>
                  )}
                </SortableContext>
              </DndContext>
            ) : (
              <Card className="text-center py-16 border-border/30 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-lg shadow-xl">
                <CardContent>
                  <div className="flex flex-col items-center gap-6 animate-fade-in">
                    <div className="p-6 bg-primary/10 rounded-full">
                      <Play className="w-16 h-16 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3 text-gradient-primary">No anime in your list</h3>
                      <p className="text-muted-foreground mb-6 text-lg leading-relaxed max-w-md">
                        Start building your anime collection by browsing and adding titles.
                      </p>
                      <Button className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg px-8 py-3">
                        Browse Anime
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manga">
            {filteredMangaList.length > 0 ? (
              <div className="space-y-4">
                 {filteredMangaList.map(entry => {
                   // Use data from normalized schema
                   const manga: Manga = {
                     id: entry.id,
                     title: entry.title,
                     title_english: entry.title_english,
                     title_japanese: entry.title_japanese,
                     image_url: entry.image_url,
                     synopsis: '',
                     type: 'Manga',
                     chapters: undefined,
                     volumes: undefined,
                     status: 'Publishing',
                     genres: []
                   };
                   if (!manga.title) return null;
                  
                  const StatusIcon = statusIcons[entry.status as keyof typeof statusIcons];
                  const statusColor = statusColors[entry.status as keyof typeof statusColors];
                  
                  return (
                    <Card key={entry.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <img 
                            src={manga.image_url}
                            alt={manga.title}
                            loading="lazy"
                            className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold line-clamp-1">{manga.title}</h3>
                              <AddToListButton item={manga} type="manga" />
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="secondary" className={`${statusColor} text-white`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {listStatuses.manga.find(s => s.value === entry.status)?.label}
                              </Badge>
                              
                              <Badge variant="outline">
                                {manga.type}
                              </Badge>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                  Chapters Read
                                </label>
                                <div className="text-lg">
                                  {entry.chapters_read} / {manga.chapters || "?"}
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                  Volumes Read
                                </label>
                                <div className="text-lg">
                                  {entry.volumes_read} / {manga.volumes || "?"}
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                  Your Rating
                                </label>
                                <RatingComponent
                                  value={entry.score || 0}
                                  onChange={(rating) => updateMangaListEntry(entry.id, { score: rating })}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-12 border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <BookOpen className="w-16 h-16 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">No manga in your list</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your manga collection by browsing and adding titles.
                      </p>
                      <Button>Browse Manga</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Bulk Operations Toolbar */}
        <BulkActionsToolbar
          selectedCount={bulkOperations.selectedCount}
          contentType={activeTab as 'anime' | 'manga'}
          onStatusUpdate={handleBulkStatusUpdate}
          onRatingUpdate={handleBulkRatingUpdate}
          onDelete={handleBulkDelete}
          onClearSelection={bulkOperations.clearSelection}
        />
      </div>
    </div>
  );
};

export default MyLists;