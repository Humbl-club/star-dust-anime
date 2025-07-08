import { supabase } from '@/integrations/supabase/client';
import type { 
  CharacterShowcase, 
  CharacterTradeListing, 
  CharacterEnhancement,
  UserAchievement,
  TradingFilters,
  ShowcaseFilters
} from '@/types/social';
import type { GeneratedCharacter } from '@/types/character';

class SocialService {
  
  // Character Showcase Methods
  async createShowcase(showcase: Omit<CharacterShowcase, 'id' | 'like_count' | 'view_count' | 'created_at' | 'updated_at'>): Promise<CharacterShowcase | null> {
    const { data, error } = await supabase
      .from('character_showcases')
      .insert(showcase)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating showcase:', error);
      return null;
    }
    
    return data as CharacterShowcase;
  }

  async getPublicShowcases(filters: ShowcaseFilters = { sortBy: 'likes' }): Promise<CharacterShowcase[]> {
    let query = supabase
      .from('character_showcases')
      .select('*')
      .eq('is_public', true);

    if (filters.featured) {
      query = query.eq('featured', true);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'likes':
        query = query.order('like_count', { ascending: false });
        break;
      case 'views':
        query = query.order('view_count', { ascending: false });
        break;
      case 'date':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);
    
    if (error) {
      console.error('Error fetching showcases:', error);
      return [];
    }
    
    return data as CharacterShowcase[];
  }

  async likeShowcase(showcaseId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('character_showcase_likes')
      .insert({ showcase_id: showcaseId, user_id: userId });
    
    if (error) {
      console.error('Error liking showcase:', error);
      return false;
    }

    // Increment like count directly
    const { data: currentData } = await supabase
      .from('character_showcases')
      .select('like_count')
      .eq('id', showcaseId)
      .single();
    
    if (currentData) {
      const { error: updateError } = await supabase
        .from('character_showcases')
        .update({ like_count: currentData.like_count + 1 })
        .eq('id', showcaseId);
      
      if (updateError) {
        console.error('Error updating like count:', updateError);
      }
    }
    
    return true;
  }

  async unlikeShowcase(showcaseId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('character_showcase_likes')
      .delete()
      .eq('showcase_id', showcaseId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error unliking showcase:', error);
      return false;
    }

    // Decrement like count directly
    const { data: currentData } = await supabase
      .from('character_showcases')
      .select('like_count')
      .eq('id', showcaseId)
      .single();
    
    if (currentData) {
      const { error: updateError } = await supabase
        .from('character_showcases')
        .update({ like_count: Math.max(currentData.like_count - 1, 0) })
        .eq('id', showcaseId);
      
      if (updateError) {
        console.error('Error updating like count:', updateError);
      }
    }
    
    return true;
  }

  // Trading Methods
  async createTradeListing(listing: Omit<CharacterTradeListing, 'id' | 'created_at' | 'updated_at'>): Promise<CharacterTradeListing | null> {
    const { data, error } = await supabase
      .from('character_trade_listings')
      .insert(listing)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating trade listing:', error);
      return null;
    }
    
    return data as CharacterTradeListing;
  }

  async getActiveTradeListings(filters: TradingFilters = { sortBy: 'date' }): Promise<CharacterTradeListing[]> {
    let query = supabase
      .from('character_trade_listings')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (filters.minPrice) {
      query = query.gte('asking_price', filters.minPrice);
    }

    if (filters.maxPrice) {
      query = query.lte('asking_price', filters.maxPrice);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('asking_price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('asking_price', { ascending: false });
        break;
      case 'date':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(100);
    
    if (error) {
      console.error('Error fetching trade listings:', error);
      return [];
    }
    
    return data as CharacterTradeListing[];
  }

  async purchaseCharacter(listingId: string, buyerId: string): Promise<boolean> {
    try {
      // This would typically be handled by a secure edge function
      const { error } = await supabase.functions.invoke('process-character-trade', {
        body: { listing_id: listingId, buyer_id: buyerId }
      });
      
      return !error;
    } catch (error) {
      console.error('Error purchasing character:', error);
      return false;
    }
  }

  // Character Enhancement Methods
  async enhanceCharacter(enhancement: Omit<CharacterEnhancement, 'id' | 'applied_at'>): Promise<CharacterEnhancement | null> {
    const { data, error } = await supabase
      .from('character_enhancements')
      .insert(enhancement)
      .select()
      .single();
    
    if (error) {
      console.error('Error enhancing character:', error);
      return null;
    }
    
    return data as CharacterEnhancement;
  }

  async getCharacterEnhancements(characterId: string): Promise<CharacterEnhancement[]> {
    const { data, error } = await supabase
      .from('character_enhancements')
      .select('*')
      .eq('character_id', characterId)
      .order('applied_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching character enhancements:', error);
      return [];
    }
    
    return data as CharacterEnhancement[];
  }

  // Achievement Methods
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
    
    return data as UserAchievement[];
  }

  async checkAndUnlockAchievements(userId: string, eventType: string, eventData: any): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase.functions.invoke('check-achievements', {
        body: { user_id: userId, event_type: eventType, event_data: eventData }
      });
      
      if (error) throw error;
      
      return data?.unlockedAchievements || [];
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  // Real-time subscriptions
  subscribeToShowcases(callback: (payload: any) => void) {
    return supabase
      .channel('public:character_showcases')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'character_showcases' }, 
        callback
      )
      .subscribe();
  }

  subscribeToTradeListings(callback: (payload: any) => void) {
    return supabase
      .channel('public:character_trade_listings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'character_trade_listings' }, 
        callback
      )
      .subscribe();
  }
}

export const socialService = new SocialService();