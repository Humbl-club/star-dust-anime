import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usernameService, UserStats, LootBox, UsernameResult } from '@/services/usernameService';
import { toast } from 'sonner';

export const useGameification = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpeningBox, setIsOpeningBox] = useState(false);
  const [lastOpenedResult, setLastOpenedResult] = useState<UsernameResult | null>(null);

  // Load user stats and loot boxes
  const loadUserData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [userStats, userLootBoxes] = await Promise.all([
        usernameService.getUserStats(user.id),
        usernameService.getUserLootBoxes(user.id)
      ]);
      
      setStats(userStats);
      setLootBoxes(userLootBoxes);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Award points for user activities
  const awardPoints = async (activityType: string, points: number, metadata?: any) => {
    if (!user?.id) return false;
    
    const success = await usernameService.awardPoints(user.id, activityType, points, metadata);
    if (success) {
      // Refresh stats
      await loadUserData();
      toast.success(`+${points} points earned!`);
    }
    return success;
  };

  // Open a loot box
  const openLootBox = async (boxType: string): Promise<UsernameResult | null> => {
    if (!user?.id || isOpeningBox) return null;
    
    try {
      setIsOpeningBox(true);
      const result = await usernameService.openLootBox(user.id, boxType);
      
      if (result) {
        setLastOpenedResult(result);
        
        // Refresh data
        await loadUserData();
        
        // Show epic notification based on tier
        if (result.tier === 'GOD') {
          toast.success(`🏆 LEGENDARY! You got ${result.username}! (GOD TIER)`, {
            duration: 10000,
          });
        } else if (result.tier === 'LEGENDARY') {
          toast.success(`⭐ Amazing! You got ${result.username}! (LEGENDARY)`, {
            duration: 5000,
          });
        } else if (result.tier === 'EPIC') {
          toast.success(`🎉 Great! You got ${result.username}! (EPIC)`, {
            duration: 3000,
          });
        } else {
          toast.success(`Nice! You got ${result.username}! (${result.tier})`);
        }
      } else {
        toast.error('Failed to open loot box');
      }
      
      return result;
    } catch (error) {
      console.error('Error opening loot box:', error);
      toast.error('Failed to open loot box');
      return null;
    } finally {
      setIsOpeningBox(false);
    }
  };

  // Purchase a loot box
  const purchaseLootBox = async (boxType: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    const costs = {
      standard: 100,
      premium: 500,
      ultra: 1000
    };
    
    const cost = costs[boxType as keyof typeof costs];
    if (!cost) return false;
    
    // Check if user has enough points
    if (!stats || stats.totalPoints < cost) {
      toast.error(`Not enough points! Need ${cost} points.`);
      return false;
    }
    
    const success = await usernameService.purchaseLootBox(user.id, boxType);
    if (success) {
      await loadUserData();
      toast.success(`${boxType} loot box purchased!`);
    } else {
      toast.error('Failed to purchase loot box');
    }
    
    return success;
  };

  // Process daily login
  const processDailyLogin = async () => {
    if (!user?.id) return;
    
    try {
      const result = await usernameService.processDailyLogin(user.id);
      if (result.points > 0) {
        toast.success(`Daily login bonus: +${result.points} points! Streak: ${result.streak} days`);
        await loadUserData();
      }
    } catch (error) {
      console.error('Error processing daily login:', error);
    }
  };

  // Get username collection
  const getUsernameCollection = async () => {
    if (!user?.id) return [];
    return await usernameService.getUsernameCollection(user.id);
  };

  // Load data when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserData();
      // Process daily login on component mount
      processDailyLogin();
    }
  }, [user?.id]);

  return {
    stats,
    lootBoxes,
    loading,
    isOpeningBox,
    lastOpenedResult,
    awardPoints,
    openLootBox,
    purchaseLootBox,
    getUsernameCollection,
    refreshData: loadUserData,
  };
};