import { supabase } from '@/integrations/supabase/client';

export interface UsernameResult {
  username: string;
  tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
  sourceAnime?: string;
  description?: string;
  personality?: string;
  isFirstTime?: boolean;
}

export interface UserStats {
  totalPoints: number;
  dailyPoints: number;
  loginStreak: number;
  currentUsername: string;
  usernameTier: string;
}

export interface LootBox {
  id: string;
  box_type: 'standard' | 'premium' | 'ultra';
  quantity: number;
}

class UsernameService {
  // Assign random username to new user
  async assignRandomUsername(userId: string): Promise<UsernameResult | null> {
    try {
      const { data, error } = await supabase.rpc('assign_random_username', {
        user_id_param: userId
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        return {
          username: data[0].username,
          tier: data[0].tier
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error assigning username:', error);
      return null;
    }
  }

  // Get user's current gamification stats
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const [pointsResult, usernameResult] = await Promise.all([
        supabase
          .from('user_points')
          .select('total_points, daily_points, login_streak')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('claimed_usernames')
          .select('username, tier')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()
      ]);

      if (pointsResult.error || usernameResult.error) {
        throw pointsResult.error || usernameResult.error;
      }

      return {
        totalPoints: pointsResult.data?.total_points || 0,
        dailyPoints: pointsResult.data?.daily_points || 0,
        loginStreak: pointsResult.data?.login_streak || 0,
        currentUsername: usernameResult.data?.username || 'Unknown',
        usernameTier: usernameResult.data?.tier || 'COMMON'
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  // Award points for user activities
  async awardPoints(userId: string, activityType: string, points: number, metadata?: any): Promise<boolean> {
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

      return true;
    } catch (error) {
      console.error('Error awarding points:', error);
      return false;
    }
  }

  // Get user's loot boxes
  async getUserLootBoxes(userId: string): Promise<LootBox[]> {
    try {
      const { data, error } = await supabase
        .from('user_loot_boxes')
        .select('id, box_type, quantity')
        .eq('user_id', userId)
        .gt('quantity', 0);

      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        box_type: item.box_type as 'standard' | 'premium' | 'ultra',
        quantity: item.quantity
      }));
    } catch (error) {
      console.error('Error fetching loot boxes:', error);
      return [];
    }
  }

  // Check if user has opened their first loot box
  async isFirstLootBox(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_first_loot_box', {
        user_id_param: userId
      });

      if (error) throw error;
      return !data; // Function returns true if opened, we want to know if it's NOT opened
    } catch (error) {
      console.error('Error checking first loot box:', error);
      return false;
    }
  }

  // Mark first loot box as opened
  async markFirstLootBoxOpened(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('mark_first_loot_box_opened', {
        user_id_param: userId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking first loot box opened:', error);
    }
  }

  // Open a loot box using secure server-side randomization
  async openLootBox(userId: string, boxType: string): Promise<UsernameResult | null> {
    try {
      console.log('Opening loot box:', { userId, boxType });
      
      // Call secure edge function for loot box opening
      const { data, error } = await supabase.functions.invoke('secure-loot-box', {
        body: {
          userId,
          boxType,
          clientSeed: crypto.getRandomValues(new Uint32Array(1))[0].toString(16)
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from loot box opening');
      }

      return {
        username: data.username,
        tier: data.tier as any,
        sourceAnime: data.sourceAnime,
        description: data.description,
        personality: data.personality,
        isFirstTime: data.isFirstTime
      };
    } catch (error) {
      console.error('Error opening loot box:', error);
      return null;
    }
  }

  // Purchase loot box with points
  async purchaseLootBox(userId: string, boxType: string): Promise<boolean> {
    const costs = {
      standard: 100,
      premium: 500,
      ultra: 1000
    };

    const cost = costs[boxType as keyof typeof costs];
    if (!cost) return false;

    try {
      // Check if user has enough points
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (pointsError || !pointsData || pointsData.total_points < cost) {
        throw new Error('Insufficient points');
      }

      // Deduct points
      const { error: deductError } = await supabase.rpc('add_user_points', {
        user_id_param: userId,
        points_to_add: -cost
      });

      if (deductError) throw deductError;

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

      return true;
    } catch (error) {
      console.error('Error purchasing loot box:', error);
      return false;
    }
  }

  // Get username collection for user
  async getUsernameCollection(userId: string): Promise<any[]> {
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
  }

  // Daily login bonus
  async processDailyLogin(userId: string): Promise<{ points: number; streak: number }> {
    try {
      const { data, error } = await supabase.rpc('process_daily_login', {
        user_id_param: userId
      });

      if (error) throw error;
      
      // The function returns an array with one row
      if (Array.isArray(data) && data.length > 0) {
        return data[0] as { points: number; streak: number };
      }
      
      return { points: 0, streak: 0 };
    } catch (error) {
      console.error('Error processing daily login:', error);
      return { points: 0, streak: 0 };
    }
  }
}

export const usernameService = new UsernameService();