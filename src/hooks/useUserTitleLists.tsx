
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { 
  UserTitleListEntry, 
  UserAnimeListEntry, 
  UserMangaListEntry, 
  ListStatus,
  AnimeStatus,
  MangaStatus,
  STATUS_LABELS
} from "@/types/userLists";
import { STATUS_MAPPING } from "@/types/userLists";

export const useUserTitleLists = () => {
  const [titleLists, setTitleLists] = useState<UserTitleListEntry[]>([]);
  const [listStatuses, setListStatuses] = useState<ListStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Helper function to convert unified entry to anime entry format
  const toAnimeEntry = (entry: UserTitleListEntry): UserAnimeListEntry => {
    const animeEntry: UserAnimeListEntry = {
      id: entry.id,
      user_id: entry.user_id,
      title_id: entry.title_id,
      episodes_watched: entry.episodes_watched,
      score: entry.score,
      start_date: entry.start_date,
      finish_date: entry.finish_date,
      notes: entry.notes,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      // Remove anime_detail_id since the column was dropped
      anime_detail_id: entry.title_id, // Use title_id for backward compatibility
      status: (entry.status?.name as AnimeStatus) || 'plan_to_watch',
      title: entry.title,
      anime_details: {
        ...entry.anime_details,
        titles: entry.title
      }
    };
    return animeEntry;
  };

  // Helper function to convert unified entry to manga entry format
  const toMangaEntry = (entry: UserTitleListEntry): UserMangaListEntry => {
    const statusName = entry.status?.name === 'on_hold_manga' ? 'on_hold' : 
                      entry.status?.name === 'dropped_manga' ? 'dropped' : 
                      entry.status?.name;
    
    const mangaEntry: UserMangaListEntry = {
      id: entry.id,
      user_id: entry.user_id,
      title_id: entry.title_id,
      chapters_read: entry.chapters_read,
      volumes_read: entry.volumes_read,
      score: entry.score,
      start_date: entry.start_date,
      finish_date: entry.finish_date,
      notes: entry.notes,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      // Remove manga_detail_id since the column was dropped
      manga_detail_id: entry.title_id, // Use title_id for backward compatibility
      status: (statusName as MangaStatus) || 'plan_to_read',
      title: entry.title,
      manga_details: {
        ...entry.manga_details,
        titles: entry.title
      }
    };
    return mangaEntry;
  };

  // Helper function to get status ID by name and media type
  const getStatusId = (statusName: string, mediaType: 'anime' | 'manga'): string | null => {
    const mappedName = STATUS_MAPPING[mediaType][statusName as any] || statusName;
    const status = listStatuses.find(s => 
      s.name === mappedName && (s.media_type === mediaType || s.media_type === 'both')
    );
    return status?.id || null;
  };

  // Fetch list statuses on mount
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const { data, error } = await supabase
          .from('list_statuses')
          .select('*')
          .order('sort_order');

        if (error) throw error;
        setListStatuses((data || []) as ListStatus[]);
      } catch (err) {
        console.error('Error fetching list statuses:', err);
      }
    };

    fetchStatuses();
  }, []);

  // Fetch user title lists
  const fetchTitleLists = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_title_lists')
        .select(`
          *,
          status:list_statuses(*),
          title:titles(*),
          anime_details:anime_details(*),
          manga_details:manga_details(*)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setTitleLists((data || []) as unknown as UserTitleListEntry[]);
    } catch (err) {
      console.error('Error fetching title lists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lists');
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy API: Get anime lists
  const fetchAnimeList = async () => {
    await fetchTitleLists();
  };

  // Legacy API: Get manga lists  
  const fetchMangaList = async () => {
    await fetchTitleLists();
  };

  // Get anime entries in legacy format
  const animeList = titleLists
    .filter(entry => entry.media_type === 'anime')
    .map(toAnimeEntry);

  // Get manga entries in legacy format
  const mangaList = titleLists
    .filter(entry => entry.media_type === 'manga')
    .map(toMangaEntry);

  // Add to anime list - now uses title_id directly instead of anime_detail_id
  const addToAnimeList = async (
    titleId: string, // Changed from animeDetailId to titleId
    status: AnimeStatus
  ): Promise<UserAnimeListEntry | undefined> => {
    if (!user?.id) {
      toast.error("Please sign in to add anime to your list");
      return;
    }

    try {
      const statusId = getStatusId(status, 'anime');
      if (!statusId) throw new Error('Invalid status');

      const { data, error } = await supabase
        .from('user_title_lists')
        .insert({
          user_id: user.id,
          title_id: titleId, // Direct use of title_id
          media_type: 'anime',
          status_id: statusId
        })
        .select(`
          *,
          status:list_statuses(*),
          title:titles(*),
          anime_details:anime_details(*)
        `)
        .single();

      if (error) throw error;

      await fetchTitleLists();
      toast.success("Added to anime list");
      return toAnimeEntry(data as unknown as UserTitleListEntry);
    } catch (err) {
      console.error('Error adding to anime list:', err);
      toast.error("Failed to add to anime list");
    }
  };

  // Add to manga list - now uses title_id directly instead of manga_detail_id
  const addToMangaList = async (
    titleId: string, // Changed from mangaDetailId to titleId
    status: MangaStatus
  ): Promise<UserMangaListEntry | undefined> => {
    if (!user?.id) {
      toast.error("Please sign in to add manga to your list");
      return;
    }

    try {
      const statusId = getStatusId(status, 'manga');
      if (!statusId) throw new Error('Invalid status');

      const { data, error } = await supabase
        .from('user_title_lists')
        .insert({
          user_id: user.id,
          title_id: titleId, // Direct use of title_id
          media_type: 'manga',
          status_id: statusId
        })
        .select(`
          *,
          status:list_statuses(*),
          title:titles(*),
          manga_details:manga_details(*)
        `)
        .single();

      if (error) throw error;

      await fetchTitleLists();
      toast.success("Added to manga list");
      return toMangaEntry(data as unknown as UserTitleListEntry);
    } catch (err) {
      console.error('Error adding to manga list:', err);
      toast.error("Failed to add to manga list");
    }
  };

  // Update anime list entry
  const updateAnimeListEntry = async (
    id: string, 
    updates: Partial<UserAnimeListEntry>
  ): Promise<UserAnimeListEntry | undefined> => {
    try {
      const updateData: any = { ...updates };
      
      // Convert status to status_id if provided
      if (updates.status) {
        const statusId = getStatusId(updates.status, 'anime');
        if (statusId) {
          updateData.status_id = statusId;
        }
        delete updateData.status;
      }

      // Remove legacy fields that no longer exist
      delete updateData.anime_detail_id;

      const { data, error } = await supabase
        .from('user_title_lists')
        .update(updateData)
        .eq('id', id)
        .eq('media_type', 'anime')
        .select(`
          *,
          status:list_statuses(*),
          title:titles(*),
          anime_details:anime_details(*)
        `)
        .single();

      if (error) throw error;

      await fetchTitleLists();
      toast.success("Updated anime list entry");
      return toAnimeEntry(data as unknown as UserTitleListEntry);
    } catch (err) {
      console.error('Error updating anime list entry:', err);
      toast.error("Failed to update anime list entry");
    }
  };

  // Update manga list entry
  const updateMangaListEntry = async (
    id: string, 
    updates: Partial<UserMangaListEntry>
  ): Promise<UserMangaListEntry | undefined> => {
    try {
      const updateData: any = { ...updates };
      
      // Convert status to status_id if provided
      if (updates.status) {
        const statusId = getStatusId(updates.status, 'manga');
        if (statusId) {
          updateData.status_id = statusId;
        }
        delete updateData.status;
      }

      // Remove legacy fields that no longer exist
      delete updateData.manga_detail_id;

      const { data, error } = await supabase
        .from('user_title_lists')
        .update(updateData)
        .eq('id', id)
        .eq('media_type', 'manga')
        .select(`
          *,
          status:list_statuses(*),
          title:titles(*),
          manga_details:manga_details(*)
        `)
        .single();

      if (error) throw error;

      await fetchTitleLists();
      toast.success("Updated manga list entry");
      return toMangaEntry(data as unknown as UserTitleListEntry);
    } catch (err) {
      console.error('Error updating manga list entry:', err);
      toast.error("Failed to update manga list entry");
    }
  };

  // Remove from anime list
  const removeFromAnimeList = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('user_title_lists')
        .delete()
        .eq('id', id)
        .eq('media_type', 'anime');

      if (error) throw error;

      await fetchTitleLists();
      toast.success("Removed from anime list");
    } catch (err) {
      console.error('Error removing from anime list:', err);
      toast.error("Failed to remove from anime list");
    }
  };

  // Remove from manga list
  const removeFromMangaList = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('user_title_lists')
        .delete()
        .eq('id', id)
        .eq('media_type', 'manga');

      if (error) throw error;

      await fetchTitleLists();
      toast.success("Removed from manga list");
    } catch (err) {
      console.error('Error removing from manga list:', err);
      toast.error("Failed to remove from manga list");
    }
  };

  // Get anime list entry by anilist ID
  const getAnimeListEntry = (anilistId: string | number): UserAnimeListEntry | undefined => {
    const entry = titleLists.find(
      item => item.media_type === 'anime' && 
              item.title?.anilist_id === Number(anilistId)
    );
    return entry ? toAnimeEntry(entry) : undefined;
  };

  // Get manga list entry by anilist ID
  const getMangaListEntry = (anilistId: string | number): UserMangaListEntry | undefined => {
    const entry = titleLists.find(
      item => item.media_type === 'manga' && 
              item.title?.anilist_id === Number(anilistId)
    );
    return entry ? toMangaEntry(entry) : undefined;
  };

  // Get anime by status
  const getAnimeByStatus = (status: AnimeStatus): UserAnimeListEntry[] => {
    return animeList.filter(item => item.status === status);
  };

  // Get manga by status
  const getMangaByStatus = (status: MangaStatus): UserMangaListEntry[] => {
    return mangaList.filter(item => item.status === status);
  };

  // Fetch lists when user changes
  useEffect(() => {
    if (user?.id && listStatuses.length > 0) {
      fetchTitleLists();
    }
  }, [user?.id, listStatuses.length]);

  return {
    // Legacy API compatibility
    animeList,
    mangaList,
    isLoading,
    loading: isLoading, // Backward compatibility
    error,
    fetchAnimeList,
    fetchMangaList,
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
    
    // New unified API
    titleLists,
    listStatuses,
    fetchTitleLists
  };
};
