import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { FilterOptions, FilterPreset } from '@/components/AdvancedFiltering';

export const useFilterPresets = () => {
  const { user } = useAuth();
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPresets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_filter_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPresets: FilterPreset[] = data?.map(preset => ({
        id: preset.id,
        name: preset.name,
        filters: preset.filters as FilterOptions,
        contentType: preset.content_type as 'anime' | 'manga',
        createdAt: preset.created_at
      })) || [];

      setPresets(formattedPresets);
    } catch (error) {
      console.error('Error loading filter presets:', error);
      toast.error('Failed to load filter presets');
    } finally {
      setLoading(false);
    }
  };

  const savePreset = async (name: string, filters: FilterOptions, contentType: 'anime' | 'manga') => {
    if (!user) {
      toast.error('You must be logged in to save presets');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_filter_presets')
        .insert({
          user_id: user.id,
          name,
          filters,
          content_type: contentType
        })
        .select()
        .single();

      if (error) throw error;

      const newPreset: FilterPreset = {
        id: data.id,
        name: data.name,
        filters: data.filters as FilterOptions,
        contentType: data.content_type as 'anime' | 'manga',
        createdAt: data.created_at
      };

      setPresets(prev => [newPreset, ...prev]);
      toast.success(`Filter preset "${name}" saved`);
    } catch (error) {
      console.error('Error saving filter preset:', error);
      toast.error('Failed to save filter preset');
    }
  };

  const deletePreset = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_filter_presets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPresets(prev => prev.filter(preset => preset.id !== id));
      toast.success('Filter preset deleted');
    } catch (error) {
      console.error('Error deleting filter preset:', error);
      toast.error('Failed to delete filter preset');
    }
  };

  useEffect(() => {
    if (user) {
      loadPresets();
    } else {
      setPresets([]);
    }
  }, [user]);

  return {
    presets,
    loading,
    savePreset,
    deletePreset,
    refreshPresets: loadPresets
  };
};