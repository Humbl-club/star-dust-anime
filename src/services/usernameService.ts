import { supabase } from '@/integrations/supabase/client';

export interface UsernameResult {
  username: string;
  tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
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
  boxType: 'standard' | 'premium' | 'ultra';
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
      return data || [];
    } catch (error) {
      console.error('Error fetching loot boxes:', error);
      return [];
    }
  }

  // Open a loot box
  async openLootBox(userId: string, boxType: string): Promise<UsernameResult | null> {
    try {
      // Check if user has the box
      const { data: boxData, error: boxError } = await supabase
        .from('user_loot_boxes')
        .select('quantity')
        .eq('user_id', userId)
        .eq('box_type', boxType)
        .single();

      if (boxError || !boxData || boxData.quantity <= 0) {
        throw new Error('No loot boxes available');
      }

      // Simulate loot box opening with weighted probabilities
      let tierProbability = Math.random();
      let targetTier: string;

      if (boxType === 'ultra') {
        // Ultra box: better odds
        if (tierProbability <= 0.001) targetTier = 'GOD';
        else if (tierProbability <= 0.01) targetTier = 'LEGENDARY';
        else if (tierProbability <= 0.1) targetTier = 'EPIC';
        else if (tierProbability <= 0.3) targetTier = 'RARE';
        else if (tierProbability <= 0.6) targetTier = 'UNCOMMON';
        else targetTier = 'COMMON';
      } else if (boxType === 'premium') {
        // Premium box: slightly better odds
        if (tierProbability <= 0.0005) targetTier = 'GOD';
        else if (tierProbability <= 0.005) targetTier = 'LEGENDARY';
        else if (tierProbability <= 0.08) targetTier = 'EPIC';
        else if (tierProbability <= 0.25) targetTier = 'RARE';
        else if (tierProbability <= 0.5) targetTier = 'UNCOMMON';
        else targetTier = 'COMMON';
      } else {
        // Standard box: normal odds
        if (tierProbability <= 0.0001) targetTier = 'GOD';
        else if (tierProbability <= 0.005) targetTier = 'LEGENDARY';
        else if (tierProbability <= 0.05) targetTier = 'EPIC';
        else if (tierProbability <= 0.2) targetTier = 'RARE';
        else if (tierProbability <= 0.5) targetTier = 'UNCOMMON';
        else targetTier = 'COMMON';
      }

      // Get random username from pool
      const { data: usernameData, error: usernameError } = await supabase
        .from('username_pool')
        .select('name, tier')
        .eq('tier', targetTier)
        .order('random()')
        .limit(1)
        .single();

      if (usernameError) throw usernameError;

      // Consume the loot box
      const { error: consumeError } = await supabase
        .from('user_loot_boxes')
        .update({ quantity: boxData.quantity - 1 })
        .eq('user_id', userId)
        .eq('box_type', boxType);

      if (consumeError) throw consumeError;

      // Add to username history
      const { error: historyError } = await supabase
        .from('username_history')
        .insert({
          user_id: userId,
          username: usernameData.name,
          tier: usernameData.tier,
          acquired_method: 'loot_box'
        });

      if (historyError) throw historyError;

      return {
        username: usernameData.name,
        tier: usernameData.tier as any
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
      return data || { points: 0, streak: 0 };
    } catch (error) {
      console.error('Error processing daily login:', error);
      return { points: 0, streak: 0 };
    }
  }
}

export const usernameService = new UsernameService();