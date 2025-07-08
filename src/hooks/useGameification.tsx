import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usernameService, UserStats, LootBox, UsernameResult } from '@/services/usernameService';
import { characterGenerationService } from '@/services/characterGenerationService';
import type { GeneratedCharacter } from '@/types/character';
import { toast } from 'sonner';

export const useGameification = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpeningBox, setIsOpeningBox] = useState(false);
  const [lastOpenedResult, setLastOpenedResult] = useState<UsernameResult | null>(null);
  const [lastGeneratedCharacter, setLastGeneratedCharacter] = useState<GeneratedCharacter | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Load user stats and loot boxes
  const loadUserData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('useGameification: Loading user data for', user.id);
      
      const [userStats, userLootBoxes] = await Promise.all([
        usernameService.getUserStats(user.id),
        usernameService.getUserLootBoxes(user.id)
      ]);
      
      console.log('useGameification: Loaded data', { userStats, userLootBoxes });
      
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

  // Check if first-time experience
  const checkFirstTime = async () => {
    if (!user?.id) return;
    
    try {
      console.log('useGameification: Checking first-time status for', user.id);
      const isFirst = await usernameService.isFirstLootBox(user.id);
      console.log('useGameification: First-time status:', isFirst);
      setIsFirstTime(isFirst);
    } catch (error) {
      console.error('Error checking first-time status:', error);
      setIsFirstTime(false);
    }
  };

  // Open a loot box with enhanced character generation
  const openLootBox = async (boxType: string): Promise<UsernameResult | null> => {
    if (!user?.id || isOpeningBox) {
      console.error('useGameification: Cannot open loot box - no user or already opening', { userId: user?.id, isOpeningBox });
      return null;
    }
    
    try {
      setIsOpeningBox(true);
      console.log('🎁 useGameification: Starting loot box opening', { userId: user.id, boxType, isFirstTime });
      
      const result = await usernameService.openLootBox(user.id, boxType);
      console.log('🎁 useGameification: Loot box service result:', result);
      
      if (result) {
        setLastOpenedResult(result);
        
        // Generate enhanced character using the new system
        try {
          console.log('🎨 useGameification: Starting character generation');
          const characterGeneration = await characterGenerationService.generateCharacter({
            username: result.username,
            tier: result.tier,
            sourceAnime: result.sourceAnime,
            description: result.description,
            forceAI: isFirstTime // Use AI for first-time experience
          });
          
          setLastGeneratedCharacter(characterGeneration.character);
          console.log('🎨 useGameification: Character generation success:', characterGeneration);
        } catch (error) {
          console.error('❌ useGameification: Character generation failed:', error);
          // Don't fail the whole process if character generation fails
        }
        
        // Mark first loot box as opened if this was the first time
        if (isFirstTime) {
          console.log('🏆 useGameification: Marking first loot box as opened');
          await usernameService.markFirstLootBoxOpened(user.id);
          setIsFirstTime(false);
        }
        
        // Refresh data
        await loadUserData();
        
        // Show epic notification based on tier (only for non-first-time)
        if (!isFirstTime) {
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
        }
      } else {
        console.error('❌ useGameification: No result from loot box opening');
        toast.error('Failed to open loot box - please try again');
      }
      
      return result;
    } catch (error) {
      console.error('❌ useGameification: Error opening loot box:', error);
      toast.error('Failed to open loot box - please check your connection');
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
      console.log('useGameification: User changed, loading data for', user.id);
      loadUserData();
      checkFirstTime();
      // Process daily login on component mount
      processDailyLogin();
    } else {
      console.log('useGameification: No user, resetting state');
      setStats(null);
      setLootBoxes([]);
      setIsFirstTime(false);
      setLastOpenedResult(null);
      setLastGeneratedCharacter(null);
    }
  }, [user?.id]);

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
    refreshData: loadUserData,
  };
};