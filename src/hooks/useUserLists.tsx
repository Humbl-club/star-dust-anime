import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserAnimeListEntry {
  id: string;
  user_id: string;
  anime_detail_id: string;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  score?: number;
  episodes_watched: number;
  start_date?: string;
  finish_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data from normalized schema
  anime_details?: {
    title_id: string;
    titles?: {
      id: string;
      title: string;
      title_english?: string;
      title_japanese?: string;
      anilist_id: number;
      image_url?: string;
    };
  };
}

export interface UserMangaListEntry {
  id: string;
  user_id: string;
  manga_detail_id: string;
  status: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';
  score?: number;
  chapters_read: number;
  volumes_read: number;
  start_date?: string;
  finish_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data from normalized schema
  manga_details?: {
    title_id: string;
    titles?: {
      id: string;
      title: string;
      title_english?: string;
      title_japanese?: string;
      anilist_id: number;
      image_url?: string;
    };
  };
}

export const useUserLists = () => {
  const { user } = useAuth();
  const [animeList, setAnimeList] = useState<UserAnimeListEntry[]>([]);
  const [mangaList, setMangaList] = useState<UserMangaListEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's anime list with normalized schema
  const fetchAnimeList = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_anime_lists')
        .select(`
          *,
          anime_details:anime_detail_id (
            title_id,
            titles:title_id (
              id,
              title,
              title_english,
              title_japanese,
              anilist_id,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAnimeList(data as UserAnimeListEntry[] || []);
    } catch (error: any) {
      console.error('Error fetching anime list:', error);
      toast.error('Failed to load anime list');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's manga list with normalized schema
  const fetchMangaList = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_manga_lists')
        .select(`
          *,
          manga_details:manga_detail_id (
            title_id,
            titles:title_id (
              id,
              title,
              title_english,
              title_japanese,
              anilist_id,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMangaList(data as UserMangaListEntry[] || []);
    } catch (error: any) {
      console.error('Error fetching manga list:', error);
      toast.error('Failed to load manga list');
    } finally {
      setLoading(false);
    }
  };

  // Add anime to list - now uses anime_detail_id
  const addToAnimeList = async (animeDetailId: string, status: UserAnimeListEntry['status'] = 'plan_to_watch') => {
    if (!user) {
      toast.error('Please sign in to add to your list');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_anime_lists')
        .insert({
          user_id: user.id,
          anime_detail_id: animeDetailId,
          status,
          episodes_watched: 0
        })
        .select(`
          *,
          anime_details:anime_detail_id (
            title_id,
            titles:title_id (
              id,
              title,
              title_english,
              title_japanese,
              anilist_id,
              image_url
            )
          )
        `)
        .single();

      if (error) throw error;
      
      setAnimeList(prev => [data as UserAnimeListEntry, ...prev]);
      toast.success('Added to your anime list!');
      return data;
    } catch (error: any) {
      console.error('Error adding to anime list:', error);
      toast.error('Failed to add to list');
    }
  };

  // Add manga to list - now uses manga_detail_id
  const addToMangaList = async (mangaDetailId: string, status: UserMangaListEntry['status'] = 'plan_to_read') => {
    if (!user) {
      toast.error('Please sign in to add to your list');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_manga_lists')
        .insert({
          user_id: user.id,
          manga_detail_id: mangaDetailId,
          status,
          chapters_read: 0,
          volumes_read: 0
        })
        .select(`
          *,
          manga_details:manga_detail_id (
            title_id,
            titles:title_id (
              id,
              title,
              title_english,
              title_japanese,
              anilist_id,
              image_url
            )
          )
        `)
        .single();

      if (error) throw error;
      
      setMangaList(prev => [data as UserMangaListEntry, ...prev]);
      toast.success('Added to your manga list!');
      return data;
    } catch (error: any) {
      console.error('Error adding to manga list:', error);
      toast.error('Failed to add to list');
    }
  };

  // Update anime list entry
  const updateAnimeListEntry = async (id: string, updates: Partial<UserAnimeListEntry>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_anime_lists')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setAnimeList(prev => prev.map(item => item.id === id ? data as UserAnimeListEntry : item));
      toast.success('Updated successfully!');
      return data;
    } catch (error: any) {
      console.error('Error updating anime list entry:', error);
      toast.error('Failed to update');
    }
  };

  // Update manga list entry
  const updateMangaListEntry = async (id: string, updates: Partial<UserMangaListEntry>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_manga_lists')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setMangaList(prev => prev.map(item => item.id === id ? data as UserMangaListEntry : item));
      toast.success('Updated successfully!');
      return data;
    } catch (error: any) {
      console.error('Error updating manga list entry:', error);
      toast.error('Failed to update');
    }
  };

  // Remove from anime list
  const removeFromAnimeList = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_anime_lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setAnimeList(prev => prev.filter(item => item.id !== id));
      toast.success('Removed from list');
    } catch (error: any) {
      console.error('Error removing from anime list:', error);
      toast.error('Failed to remove');
    }
  };

  // Remove from manga list
  const removeFromMangaList = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_manga_lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setMangaList(prev => prev.filter(item => item.id !== id));
      toast.success('Removed from list');
    } catch (error: any) {
      console.error('Error removing from manga list:', error);
      toast.error('Failed to remove');
    }
  };

  // Check if anime is in user's list by anilist_id
  const getAnimeListEntry = (anilistId: string | number) => {
    return animeList.find(entry => 
      entry.anime_details?.titles?.anilist_id === parseInt(anilistId.toString())
    );
  };

  // Check if manga is in user's list by anilist_id  
  const getMangaListEntry = (anilistId: string | number) => {
    return mangaList.find(entry => 
      entry.manga_details?.titles?.anilist_id === parseInt(anilistId.toString())
    );
  };

  // Get lists by status
  const getAnimeByStatus = (status: UserAnimeListEntry['status']) => {
    return animeList.filter(entry => entry.status === status);
  };

  const getMangaByStatus = (status: UserMangaListEntry['status']) => {
    return mangaList.filter(entry => entry.status === status);
  };

  useEffect(() => {
    if (user) {
      fetchAnimeList();
      fetchMangaList();
    } else {
      setAnimeList([]);
      setMangaList([]);
    }
  }, [user]);

  return {
    animeList,
    mangaList,
    loading,
    addToAnimeList,
    addToMangaList,
    updateAnimeListEntry,
    updateMangaListEntry,
    removeFromAnimeList,
    removeFromMangaList,
    getAnimeListEntry,
    getMangaListEntry,
    getAnimeByStatus,
    getMangaByStatus,
    refetch: () => {
      fetchAnimeList();
      fetchMangaList();
    }
  };
};