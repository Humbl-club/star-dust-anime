import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GeneratedCharacter } from '@/types/character';

interface LootBox {
  id: string;
  box_type: 'standard' | 'premium' | 'ultra';
  quantity: number;
}

interface UserStats {
  totalPoints: number;
  dailyPoints: number;
  loginStreak: number;
  currentUsername: string;
  usernameTier: string;
}

interface LootBoxResult {
  username: string;
  tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
  source_anime?: string;
  description?: string;
  personality?: string;
  is_first_time?: boolean;
  server_seed?: string;
  random_value?: number;
}

interface GamificationState {
  // State
  stats: UserStats | null;
  lootBoxes: LootBox[];
  lastOpenedResult: LootBoxResult | null;
  lastGeneratedCharacter: GeneratedCharacter | null;
  isFirstTime: boolean;
  loading: boolean;
  isOpeningBox: boolean;
  
  // Actions
  loadUserData: (userId: string) => Promise<void>;
  openLootBox: (userId: string, boxType: string) => Promise<LootBoxResult | null>;
  purchaseLootBox: (userId: string, boxType: string) => Promise<boolean>;
  awardPoints: (userId: string, activityType: string, points: number, metadata?: any) => Promise<boolean>;
  getUsernameCollection: (userId: string) => Promise<any[]>;
  reset: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  // Initial state
  stats: null,
  lootBoxes: [],
  lastOpenedResult: null,
  lastGeneratedCharacter: null,
  isFirstTime: false,
  loading: false,
  isOpeningBox: false,

  // Load user data using the new database function
  loadUserData: async (userId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.rpc('get_user_gamification_summary', {
        user_id_param: userId
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const userData = data[0];
        
        // Transform snake_case database fields to camelCase for frontend
        set({
          stats: {
            totalPoints: userData.total_points || 0,
            dailyPoints: userData.daily_points || 0,
            loginStreak: userData.login_streak || 0,
            currentUsername: userData.current_username || 'Unknown',
            usernameTier: userData.username_tier || 'COMMON'
          },
          lootBoxes: Array.isArray(userData.loot_boxes) ? userData.loot_boxes.map((box: any) => ({
            id: box.id,
            box_type: box.box_type,
            quantity: box.quantity
          })) : [],
          loading: false
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      set({ loading: false });
    }
  },

  // Open loot box using the new database function
  openLootBox: async (userId: string, boxType: string) => {
    const { isOpeningBox } = get();
    if (isOpeningBox) return null;

    set({ isOpeningBox: true });
    try {
      const { data, error } = await supabase.rpc('open_loot_box_secure', {
        user_id_param: userId,
        box_type_param: boxType
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        
        // Transform to proper typed result
        const typedResult: LootBoxResult = {
          username: result.username,
          tier: result.tier as any,
          source_anime: result.source_anime,
          description: result.description,
          personality: result.personality,
          is_first_time: result.is_first_time,
          server_seed: result.server_seed,
          random_value: result.random_value
        };

        // Create character data for display
        const character: GeneratedCharacter = {
          id: crypto.randomUUID(),
          username: typedResult.username,
          tier: typedResult.tier as any,
          character_data: {
            template: {} as any,
            variation: {} as any,
            animation: {} as any,
            visual_data: {
              hair_color: '#000000',
              eye_color: '#000000',
              skin_tone: '#000000',
              outfit_color: '#000000',
              accessory_color: '#000000'
            },
            personality_traits: [typedResult.personality || 'mysterious'],
            source_anime: typedResult.source_anime,
            description: typedResult.description,
            personality: typedResult.personality,
            tier: typedResult.tier
          },
          cached_at: new Date().toISOString(),
          cache_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          image_url: null,
          generation_method: 'procedural'
        };

        set({ 
          lastOpenedResult: typedResult,
          lastGeneratedCharacter: character,
          isFirstTime: typedResult.is_first_time || false
        });

        // Show notification based on tier
        if (typedResult.tier === 'GOD') {
          toast.success(`🏆 LEGENDARY! You got ${typedResult.username}! (GOD TIER)`, {
            duration: 10000,
          });
        } else if (typedResult.tier === 'LEGENDARY') {
          toast.success(`⭐ Amazing! You got ${typedResult.username}! (LEGENDARY)`, {
            duration: 5000,
          });
        } else if (typedResult.tier === 'EPIC') {
          toast.success(`🎉 Great! You got ${typedResult.username}! (EPIC)`, {
            duration: 3000,
          });
        } else {
          toast.success(`Nice! You got ${typedResult.username}! (${typedResult.tier})`);
        }

        // Refresh user data
        await get().loadUserData(userId);
        
        return typedResult;
      }
      
      return null;
    } catch (error) {
      console.error('Error opening loot box:', error);
      toast.error('Failed to open loot box - please try again');
      return null;
    } finally {
      set({ isOpeningBox: false });
    }
  },

  // Purchase loot box
  purchaseLootBox: async (userId: string, boxType: string) => {
    const costs = {
      standard: 100,
      premium: 500,
      ultra: 1000
    };

    const cost = costs[boxType as keyof typeof costs];
    if (!cost) return false;

    const { stats } = get();
    if (!stats || stats.totalPoints < cost) {
      toast.error(`Not enough points! Need ${cost} points.`);
      return false;
    }

    try {
      // Deduct points
      const { error: pointsError } = await supabase.rpc('add_user_points', {
        user_id_param: userId,
        points_to_add: -cost
      });

      if (pointsError) throw pointsError;

      // Add loot box
      const { error: boxError } = await supabase
        .from('user_loot_boxes')
        .upsert({
          user_id: userId,
          box_type: boxType,
          quantity: 1
        }, {
          onConflict: 'user_id,box_type'
        });

      if (boxError) throw boxError;

      toast.success(`${boxType} loot box purchased!`);
      await get().loadUserData(userId);
      return true;
    } catch (error) {
      console.error('Error purchasing loot box:', error);
      toast.error('Failed to purchase loot box');
      return false;
    }
  },

  // Award points
  awardPoints: async (userId: string, activityType: string, points: number, metadata?: any) => {
    try {
      // Insert activity record
      const { error: activityError } = await supabase
        .from('daily_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          points_earned: points,
          metadata: metadata || {}
        });

      if (activityError) throw activityError;

      // Update user points
      const { error: pointsError } = await supabase.rpc('add_user_points', {
        user_id_param: userId,
        points_to_add: points
      });

      if (pointsError) throw pointsError;

      toast.success(`+${points} points earned!`);
      await get().loadUserData(userId);
      return true;
    } catch (error) {
      console.error('Error awarding points:', error);
      return false;
    }
  },

  // Get username collection
  getUsernameCollection: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('username_history')
        .select('username, tier, acquired_method, acquired_at')
        .eq('user_id', userId)
        .order('acquired_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching username collection:', error);
      return [];
    }
  },

  // Reset state
  reset: () => {
    set({
      stats: null,
      lootBoxes: [],
      lastOpenedResult: null,
      lastGeneratedCharacter: null,
      isFirstTime: false,
      loading: false,
      isOpeningBox: false
    });
  }
}));