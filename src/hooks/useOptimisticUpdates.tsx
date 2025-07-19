import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';

export const useOptimisticUpdates = () => {
  const queryClient = useQueryClient();

  const updateContentOptimistically = (
    contentType: 'anime' | 'manga',
    contentId: string,
    updates: Record<string, unknown>
  ) => {
    const queryKey = queryKeys.content.detail(contentType, contentId);
    
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updates };
    });
  };

  const updateListOptimistically = (
    contentType: 'anime' | 'manga',
    filters: Record<string, unknown>,
    updater: (oldData: any) => any
  ) => {
    const queryKey = queryKeys.content.list(contentType, filters);
    
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return updater(oldData);
    });
  };

  const addToListOptimistically = (
    contentType: 'anime' | 'manga',
    filters: Record<string, unknown>,
    newItem: any
  ) => {
    updateListOptimistically(contentType, filters, (oldData) => ({
      ...oldData,
      data: [newItem, ...oldData.data],
      pagination: {
        ...oldData.pagination,
        total: oldData.pagination.total + 1
      }
    }));
  };

  const removeFromListOptimistically = (
    contentType: 'anime' | 'manga', 
    filters: Record<string, unknown>,
    itemId: string
  ) => {
    updateListOptimistically(contentType, filters, (oldData) => ({
      ...oldData,
      data: oldData.data.filter((item: any) => item.id !== itemId),
      pagination: {
        ...oldData.pagination,
        total: oldData.pagination.total - 1
      }
    }));
  };

  const updateUserPreferenceOptimistically = (
    userId: string,
    updates: Record<string, unknown>
  ) => {
    const queryKey = queryKeys.user.preferences(userId);
    
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return { ...oldData.data, ...updates };
    });
  };

  return {
    updateContentOptimistically,
    updateListOptimistically,
    addToListOptimistically,
    removeFromListOptimistically,
    updateUserPreferenceOptimistically,
  };
};