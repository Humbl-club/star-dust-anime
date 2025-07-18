import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface BulkOperationsHook<T> {
  selectedItems: Set<string>;
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  selectAll: (items: T[]) => void;
  clearSelection: () => void;
  toggleSelectAll: (items: T[]) => void;
  isSelected: (id: string) => boolean;
  selectedCount: number;
  bulkUpdateStatus: (status: string, updateFn: (id: string, updates: Record<string, unknown>) => Promise<unknown>) => Promise<void>;
  bulkDelete: (deleteFn: (id: string) => Promise<unknown>) => Promise<void>;
  bulkUpdateRating: (rating: number, updateFn: (id: string, updates: Record<string, unknown>) => Promise<unknown>) => Promise<void>;
}

export const useBulkOperations = <T extends { id: string }>(): BulkOperationsHook<T> => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const selectItem = useCallback((id: string) => {
    setSelectedItems(prev => new Set(prev).add(id));
  }, []);

  const deselectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const selectAll = useCallback((items: T[]) => {
    setSelectedItems(new Set(items.map(item => item.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const toggleSelectAll = useCallback((items: T[]) => {
    if (selectedItems.size === items.length) {
      clearSelection();
    } else {
      selectAll(items);
    }
  }, [selectedItems.size, selectAll, clearSelection]);

  const isSelected = useCallback((id: string) => {
    return selectedItems.has(id);
  }, [selectedItems]);

  const bulkUpdateStatus = async (
    status: string, 
    updateFn: (id: string, updates: Record<string, unknown>) => Promise<unknown>
  ) => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      const promises = Array.from(selectedItems).map(id => 
        updateFn(id, { status })
      );
      
      await Promise.all(promises);
      toast.success(`Updated ${selectedItems.size} items to ${status}`);
      clearSelection();
    } catch (error) {
      console.error('Bulk status update failed:', error);
      toast.error('Failed to update some items');
    }
  };

  const bulkDelete = async (deleteFn: (id: string) => Promise<unknown>) => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      const promises = Array.from(selectedItems).map(id => deleteFn(id));
      await Promise.all(promises);
      toast.success(`Removed ${selectedItems.size} items from list`);
      clearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Failed to remove some items');
    }
  };

  const bulkUpdateRating = async (
    rating: number,
    updateFn: (id: string, updates: Record<string, unknown>) => Promise<unknown>
  ) => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      const promises = Array.from(selectedItems).map(id => 
        updateFn(id, { score: rating })
      );
      
      await Promise.all(promises);
      toast.success(`Updated rating for ${selectedItems.size} items`);
      clearSelection();
    } catch (error) {
      console.error('Bulk rating update failed:', error);
      toast.error('Failed to update ratings for some items');
    }
  };

  return {
    selectedItems,
    selectItem,
    deselectItem,
    selectAll,
    clearSelection,
    toggleSelectAll,
    isSelected,
    selectedCount: selectedItems.size,
    bulkUpdateStatus,
    bulkDelete,
    bulkUpdateRating,
  };
};