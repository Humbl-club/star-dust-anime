import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ContentType } from '@/types/database.types';
import { SearchFilters } from '@/store/searchStore';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface UserFilterPreset {
  id: string;
  user_id: string | null;
  name: string;
  content_type: string;
  filters: Json;
  created_at: string;
  updated_at: string;
}

export const useFilterPresets = (contentType: ContentType) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all presets for the user and content type
  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['filter-presets', user?.id, contentType],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_filter_presets')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserFilterPreset[];
    },
    enabled: !!user?.id,
  });

  // Save preset mutation
  const savePresetMutation = useMutation({
    mutationFn: async ({ name, filters }: {
      name: string;
      filters: SearchFilters;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_filter_presets')
        .insert({
          user_id: user.id,
          name,
          content_type: contentType,
          filters: filters as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', user?.id, contentType] });
      toast.success('Preset saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save preset: ${error.message}`);
    },
  });

  // Load preset mutation
  const loadPresetMutation = useMutation({
    mutationFn: async (presetId: string) => {
      const { data, error } = await supabase
        .from('user_filter_presets')
        .select('*')
        .eq('id', presetId)
        .single();

      if (error) throw error;
      return data as UserFilterPreset;
    },
    onSuccess: (preset) => {
      toast.success(`Loaded preset: ${preset.name}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to load preset: ${error.message}`);
    },
  });

  // Delete preset mutation
  const deletePresetMutation = useMutation({
    mutationFn: async (presetId: string) => {
      const { error } = await supabase
        .from('user_filter_presets')
        .delete()
        .eq('id', presetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', user?.id, contentType] });
      toast.success('Preset deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete preset: ${error.message}`);
    },
  });

  // Update preset mutation
  const updatePresetMutation = useMutation({
    mutationFn: async ({ presetId, name, filters }: {
      presetId: string;
      name?: string;
      filters?: SearchFilters;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (filters !== undefined) updateData.filters = filters as unknown as Json;

      const { data, error } = await supabase
        .from('user_filter_presets')
        .update(updateData)
        .eq('id', presetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets', user?.id, contentType] });
      toast.success('Preset updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update preset: ${error.message}`);
    },
  });

  const savePreset = (name: string, filters: SearchFilters) => {
    savePresetMutation.mutate({ name, filters });
  };

  const loadPreset = (presetId: string): Promise<UserFilterPreset> => {
    return loadPresetMutation.mutateAsync(presetId);
  };

  const deletePreset = (presetId: string) => {
    deletePresetMutation.mutate(presetId);
  };

  const updatePreset = (presetId: string, updates: { name?: string; filters?: SearchFilters }) => {
    updatePresetMutation.mutate({ presetId, ...updates });
  };

  return {
    presets,
    isLoading,
    savePreset,
    loadPreset,
    deletePreset,
    updatePreset,
    isOperating: savePresetMutation.isPending || 
                 loadPresetMutation.isPending || 
                 deletePresetMutation.isPending || 
                 updatePresetMutation.isPending,
  };
};