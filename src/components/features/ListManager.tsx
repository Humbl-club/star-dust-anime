import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  useSortable,
  SortableContext as SortableContextProvider
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Edit2, 
  Check, 
  X, 
  MoreHorizontal,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';
import { useUserTitleLists } from '@/hooks/useUserTitleLists';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { type UserTitleListEntry, type ListStatus } from '@/types/userLists';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ListItemProps {
  item: UserTitleListEntry;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (id: string) => void;
  onSave: (id: string, updates: Partial<UserTitleListEntry>) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, statusId: string) => void;
  onProgressChange: (id: string, progress: number) => void;
  listStatuses: ListStatus[];
  maxProgress?: number;
}

function SortableListItem({ 
  item, 
  isSelected, 
  isEditing, 
  onSelect, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete,
  onStatusChange,
  onProgressChange,
  listStatuses,
  maxProgress
}: ListItemProps) {
  const [editValues, setEditValues] = useState({
    progress: item.progress || 0,
    rating: item.rating || 0,
    notes: item.notes || ''
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const currentStatus = listStatuses.find(s => s.id === item.status_id);
  const mediaTypeStatuses = listStatuses.filter(s => 
    s.media_type === item.media_type || s.media_type === 'both'
  );

  const getMaxProgress = () => {
    if (maxProgress) return maxProgress;
    if (item.media_type === 'anime') {
      return (item as any).anime_details?.episodes || 24;
    } else {
      return (item as any).manga_details?.chapters || 50;
    }
  };

  const handleProgressIncrement = () => {
    const newProgress = Math.min((item.progress || 0) + 1, getMaxProgress());
    onProgressChange(item.id, newProgress);
  };

  const handleProgressDecrement = () => {
    const newProgress = Math.max((item.progress || 0) - 1, 0);
    onProgressChange(item.id, newProgress);
  };

  const handleSave = () => {
    onSave(item.id, editValues);
    setEditValues({
      progress: item.progress || 0,
      rating: item.rating || 0,
      notes: item.notes || ''
    });
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Selection checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(item.id, !!checked)}
          />

          {/* Drag handle */}
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">
                  {(item.title as any)?.title || `Title ${item.title_id}`}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {currentStatus?.label || 'Unknown'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {item.media_type}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleSave}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={onCancel}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="z-dropdown">
                      <DropdownMenuItem onClick={() => onEdit(item.id)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Progress and Status Controls */}
            <div className="mt-3 space-y-2">
              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[60px]">Status:</span>
                <Select
                  value={item.status_id}
                  onValueChange={(value) => onStatusChange(item.id, value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-dropdown">
                    {mediaTypeStatuses.map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Progress Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground min-w-[60px]">Progress:</span>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editValues.progress}
                    onChange={(e) => setEditValues(prev => ({
                      ...prev,
                      progress: parseInt(e.target.value) || 0
                    }))}
                    className="h-8 w-20 text-xs"
                    min={0}
                    max={getMaxProgress()}
                  />
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleProgressDecrement}
                      disabled={(item.progress || 0) <= 0}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-medium min-w-[60px] text-center">
                      {item.progress || 0} / {getMaxProgress()}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleProgressIncrement}
                      disabled={(item.progress || 0) >= getMaxProgress()}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(((item.progress || 0) / getMaxProgress()) * 100, 100)}%` 
                  }}
                />
              </div>

              {/* Edit Fields */}
              {isEditing && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground min-w-[60px]">Rating:</span>
                    <Input
                      type="number"
                      value={editValues.rating}
                      onChange={(e) => setEditValues(prev => ({
                        ...prev,
                        rating: parseInt(e.target.value) || 0
                      }))}
                      className="h-8 w-20 text-xs"
                      min={0}
                      max={10}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground min-w-[60px]">Notes:</span>
                    <Input
                      value={editValues.notes}
                      onChange={(e) => setEditValues(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      className="h-8 text-xs flex-1"
                      placeholder="Add notes..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ListManagerProps {
  contentType: 'anime' | 'manga';
  statusFilter?: string;
}

export function ListManager({ contentType, statusFilter }: ListManagerProps) {
  const { titleLists, listStatuses, updateAnimeListEntry, updateMangaListEntry, removeFromAnimeList, removeFromMangaList } = useUserTitleLists();
  const { scheduleUserListUpdate } = useBackgroundSync();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter items by content type and status
  const filteredItems = titleLists.filter(item => {
    const matchesType = item.media_type === contentType;
    const matchesStatus = !statusFilter || item.status_id === statusFilter;
    return matchesType && matchesStatus;
  }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredItems.findIndex(item => item.id === active.id);
      const newIndex = filteredItems.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(filteredItems, oldIndex, newIndex);
        
        // Update sort order for affected items
        newItems.forEach((item, index) => {
          const updates = { sort_order: index };
          if (contentType === 'anime') {
            updateAnimeListEntry(item.title_id, updates);
          } else {
            updateMangaListEntry(item.title_id, updates);
          }
          scheduleUserListUpdate(item);
        });
        
        toast.success('List order updated');
      }
    }
  }, [filteredItems, contentType, updateAnimeListEntry, updateMangaListEntry, scheduleUserListUpdate]);

  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleEdit = useCallback((id: string) => {
    setEditingItem(id);
  }, []);

  const handleSave = useCallback((id: string, updates: Partial<UserTitleListEntry>) => {
    const item = filteredItems.find(i => i.id === id);
    if (!item) return;

    if (contentType === 'anime') {
      updateAnimeListEntry(item.title_id, updates as any);
    } else {
      updateMangaListEntry(item.title_id, updates as any);
    }
    
    scheduleUserListUpdate({ ...item, ...updates });
    setEditingItem(null);
    toast.success('Entry updated');
  }, [filteredItems, contentType, updateAnimeListEntry, updateMangaListEntry, scheduleUserListUpdate]);

  const handleCancel = useCallback(() => {
    setEditingItem(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    const item = filteredItems.find(i => i.id === id);
    if (!item) return;

    if (contentType === 'anime') {
      removeFromAnimeList(item.title_id);
    } else {
      removeFromMangaList(item.title_id);
    }
    
    toast.success('Entry removed');
  }, [filteredItems, contentType, removeFromAnimeList, removeFromMangaList]);

  const handleStatusChange = useCallback((id: string, statusId: string) => {
    const item = filteredItems.find(i => i.id === id);
    if (!item) return;

    const updates = { status_id: statusId };
    if (contentType === 'anime') {
      updateAnimeListEntry(item.title_id, updates);
    } else {
      updateMangaListEntry(item.title_id, updates);
    }
    
    scheduleUserListUpdate({ ...item, ...updates });
    toast.success('Status updated');
  }, [filteredItems, contentType, updateAnimeListEntry, updateMangaListEntry, scheduleUserListUpdate]);

  const handleProgressChange = useCallback((id: string, progress: number) => {
    const item = filteredItems.find(i => i.id === id);
    if (!item) return;

    const updates = { progress };
    if (contentType === 'anime') {
      updateAnimeListEntry(item.title_id, updates);
    } else {
      updateMangaListEntry(item.title_id, updates);
    }
    
    scheduleUserListUpdate({ ...item, ...updates });
  }, [filteredItems, contentType, updateAnimeListEntry, updateMangaListEntry, scheduleUserListUpdate]);

  const handleBatchStatusChange = useCallback((statusId: string) => {
    selectedItems.forEach(id => {
      handleStatusChange(id, statusId);
    });
    setSelectedItems(new Set());
    setBatchMode(false);
    toast.success(`Updated ${selectedItems.size} items`);
  }, [selectedItems, handleStatusChange]);

  const handleBatchDelete = useCallback(() => {
    selectedItems.forEach(id => {
      handleDelete(id);
    });
    setSelectedItems(new Set());
    setBatchMode(false);
    toast.success(`Removed ${selectedItems.size} items`);
  }, [selectedItems, handleDelete]);

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  }, [selectedItems.size, filteredItems]);

  return (
    <div className="space-y-4">
      {/* Batch Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {contentType === 'anime' ? 'Anime' : 'Manga'} List ({filteredItems.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={batchMode ? "default" : "outline"}
                size="sm"
                onClick={() => setBatchMode(!batchMode)}
              >
                Batch Select
              </Button>
              {batchMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </div>
          
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} selected
              </span>
              <Select onValueChange={handleBatchStatusChange}>
                <SelectTrigger className="w-40 h-8">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent className="z-dropdown">
                  {listStatuses
                    .filter(s => s.media_type === contentType || s.media_type === 'both')
                    .map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Selected
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* List Items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {filteredItems.map(item => (
              <SortableListItem
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                isEditing={editingItem === item.id}
                onSelect={handleSelect}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onProgressChange={handleProgressChange}
                listStatuses={listStatuses}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No {contentType} in your list yet. Start adding some!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}