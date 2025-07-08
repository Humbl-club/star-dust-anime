import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/hooks/useGamificationStore';
import { usernameService } from '@/services/usernameService';
import { toast } from 'sonner';

export const useGameification = () => {
  const { user } = useAuth();
  const {
    stats,
    lootBoxes,
    lastOpenedResult,
    lastGeneratedCharacter,
    isFirstTime,
    loading,
    isOpeningBox,
    loadUserData,
    openLootBox: storeOpenLootBox,
    purchaseLootBox: storePurchaseLootBox,
    awardPoints: storeAwardPoints,
    getUsernameCollection: storeGetUsernameCollection,
    reset,
    lastLoadedUserId,
    setLastLoadedUserId
  } = useGamificationStore();

  // Wrapper functions to maintain API compatibility
  const awardPoints = async (activityType: string, points: number, metadata?: any) => {
    if (!user?.id) return false;
    return await storeAwardPoints(user.id, activityType, points, metadata);
  };

  const openLootBox = async (boxType: string) => {
    if (!user?.id) return null;
    return await storeOpenLootBox(user.id, boxType);
  };

  const purchaseLootBox = async (boxType: string) => {
    if (!user?.id) return false;
    return await storePurchaseLootBox(user.id, boxType);
  };

  const getUsernameCollection = async () => {
    if (!user?.id) return [];
    return await storeGetUsernameCollection(user.id);
  };

  const refreshData = async () => {
    if (!user?.id) return;
    await loadUserData(user.id);
  };

  // Process daily login using the existing service with debouncing
  const processDailyLogin = async () => {
    if (!user?.id) return;
    
    try {
      const result = await usernameService.processDailyLogin(user.id);
      if (result.points > 0) {
        toast.success(`Daily login bonus: +${result.points} points! Streak: ${result.streak} days`);
        await refreshData();
      }
    } catch (error) {
      console.error('Error processing daily login:', error);
    }
  };

  // Load data when user changes with proper debouncing and guards
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (user?.id) {
      // Prevent loading if we already loaded for this user and we're not in loading state
      if (lastLoadedUserId === user.id && !loading) {
        return;
      }
      
      console.log('useGameification: User changed, loading data for', user.id);
      
      // Longer debounce to prevent rapid-fire calls during auth state changes
      timeoutId = setTimeout(async () => {
        try {
          setLastLoadedUserId(user.id);
          await loadUserData(user.id);
          await processDailyLogin();
        } catch (error) {
          console.error('Error during user data initialization:', error);
        }
      }, 500); // Increased debounce time
    } else {
      console.log('useGameification: No user, resetting state');
      reset();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id]); // Removed dependencies that cause loops

  return {
    stats,
    lootBoxes,
    loading,
    isOpeningBox,
    lastOpenedResult,
    lastGeneratedCharacter,
    isFirstTime,
    awardPoints,
    openLootBox,
    purchaseLootBox,
    getUsernameCollection,
    refreshData,
  };
};