import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { FilterOptions, FilterPreset } from '@/components/AdvancedFiltering';

// Use localStorage for filter presets since we don't have the database table yet
export const useFilterPresets = () => {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [loading, setLoading] = useState(false);

  const STORAGE_KEY = 'filter-presets';

  const loadPresets = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPresets = JSON.parse(stored) as FilterPreset[];
        setPresets(parsedPresets);
      }
    } catch (error) {
      console.error('Error loading filter presets:', error);
    }
  };

  const saveToStorage = (newPresets: FilterPreset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    } catch (error) {
      console.error('Error saving filter presets:', error);
    }
  };

  const savePreset = (name: string, filters: FilterOptions, contentType: 'anime' | 'manga') => {
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters,
      contentType,
      createdAt: new Date().toISOString()
    };

    const updatedPresets = [newPreset, ...presets];
    setPresets(updatedPresets);
    saveToStorage(updatedPresets);
    toast.success(`Filter preset "${name}" saved`);
  };

  const deletePreset = (id: string) => {
    const updatedPresets = presets.filter(preset => preset.id !== id);
    setPresets(updatedPresets);
    saveToStorage(updatedPresets);
    toast.success('Filter preset deleted');
  };

  useEffect(() => {
    loadPresets();
  }, []);

  return {
    presets,
    loading,
    savePreset,
    deletePreset,
    refreshPresets: loadPresets
  };
};