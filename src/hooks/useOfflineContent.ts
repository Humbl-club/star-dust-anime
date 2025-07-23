import { useState, useEffect } from 'react';
import { indexedDBManager, AnimeData, MangaData } from '@/lib/storage/indexedDB';

export const useOfflineContent = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheAnime = async (anime: any) => {
    const animeData: AnimeData = {
      id: anime.id,
      title: anime.title,
      image_url: anime.image_url,
      synopsis: anime.synopsis,
      score: anime.score,
      episodes: anime.episodes,
      status: anime.status,
      genres: anime.genres,
      studios: anime.studios,
      cached_at: Date.now()
    };
    
    await indexedDBManager.cacheAnime(animeData);
  };

  const cacheManga = async (manga: any) => {
    const mangaData: MangaData = {
      id: manga.id,
      title: manga.title,
      image_url: manga.image_url,
      synopsis: manga.synopsis,
      score: manga.score,
      chapters: manga.chapters,
      volumes: manga.volumes,
      status: manga.status,
      genres: manga.genres,
      authors: manga.authors,
      cached_at: Date.now()
    };
    
    await indexedDBManager.cacheManga(mangaData);
  };

  const getCachedAnime = async (id: string) => {
    return indexedDBManager.getCachedAnime(id);
  };

  const getCachedManga = async (id: string) => {
    return indexedDBManager.getCachedManga(id);
  };

  const addOfflineAction = async (type: 'add_to_list' | 'update_progress' | 'rate_title' | 'write_review', data: any) => {
    await indexedDBManager.addOfflineAction({ type, data });
  };

  const addSearchHistory = async (query: string, contentType: 'anime' | 'manga' | 'all', resultsCount: number) => {
    await indexedDBManager.addSearchHistory(query, contentType, resultsCount);
  };

  return {
    isOnline,
    cacheAnime,
    cacheManga,
    getCachedAnime,
    getCachedManga,
    addOfflineAction,
    addSearchHistory
  };
};