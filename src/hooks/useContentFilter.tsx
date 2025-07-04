import { useAgeVerification } from './useAgeVerification';

export const useContentFilter = () => {
  const { preferences, isVerified } = useAgeVerification();

  const filterAnimeContent = (animeList: any[]) => {
    if (!isVerified || !preferences) return animeList;

    return animeList.filter(anime => {
      // Apply Apple Store content guidelines
      
      // Block adult content for users under 18
      const hasAdultContent = anime.genres?.some((genre: string) => 
        ['Hentai', 'Yaoi', 'Yuri', 'Ecchi'].includes(genre)
      ) || anime.demographics?.includes('Hentai');

      if (hasAdultContent && !preferences.show_adult_content) {
        return false;
      }

      // Apply age-based filtering according to user preferences
      const contentRating = getContentRating(anime);
      return shouldShowContent(contentRating);
    });
  };

  const filterMangaContent = (mangaList: any[]) => {
    if (!isVerified || !preferences) return mangaList;

    return mangaList.filter(manga => {
      // Apply same filtering for manga
      const hasAdultContent = manga.genres?.some((genre: string) => 
        ['Hentai', 'Yaoi', 'Yuri', 'Ecchi', 'Erotica'].includes(genre)
      ) || manga.demographics?.includes('Hentai');

      if (hasAdultContent && !preferences.show_adult_content) {
        return false;
      }

      const contentRating = getContentRating(manga);
      return shouldShowContent(contentRating);
    });
  };

  const getContentRating = (content: any) => {
    const genres = content.genres || [];
    const demographics = content.demographics || [];
    
    // Apple Store compliant content rating system
    if (demographics.includes('Hentai') || genres.some((g: string) => ['Hentai'].includes(g))) {
      return 'adult';
    }
    
    if (genres.some((g: string) => ['Ecchi', 'Yaoi', 'Yuri'].includes(g))) {
      return 'mature';
    }
    
    if (genres.some((g: string) => ['Romance', 'Drama', 'Thriller', 'Horror'].includes(g))) {
      return 'teen';
    }
    
    return 'all';
  };

  const shouldShowContent = (contentRating: string) => {
    if (!preferences) return false;
    
    const userLevel = preferences.content_rating_preference;
    const ratingLevels = { 'all': 0, 'teen': 1, 'mature': 2, 'adult': 3 };
    
    const contentLevel = ratingLevels[contentRating as keyof typeof ratingLevels] ?? 0;
    const userLevelNum = ratingLevels[userLevel] ?? 0;
    
    return contentLevel <= userLevelNum;
  };

  return {
    filterAnimeContent,
    filterMangaContent,
    getContentRating,
    shouldShowContent,
    isVerified
  };
};