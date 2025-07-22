import { BaseApiService, ServiceResponse } from './baseService';

export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  birth_date?: string;
  role: string;
  verification_status: string;
  verification_required_until?: string;
  created_at: string;
  updated_at: string;
}

export interface UserList {
  id: string;
  user_id: string;
  title_id: string;
  status_id: string;
  score?: number;
  episodes_watched?: number;
  chapters_read?: number;
  volumes_read?: number;
  start_date?: string;
  finish_date?: string;
  notes?: string;
  media_type: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_genres: string[];
  excluded_genres: string[];
  show_adult_content: boolean;
  auto_add_sequels: boolean;
  list_visibility: string;
  privacy_level: string;
  notification_settings: any; // Keep as any to match Supabase Json type
  created_at: string;
  updated_at: string;
}

class UserApiService extends BaseApiService {
  // Get user profile
  async getUserProfile(userId: string): Promise<ServiceResponse<UserProfile | null>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return this.handleSuccess(data);
    } catch (err: any) {
      return this.handleError(err, 'fetch user profile');
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<ServiceResponse<UserProfile | null>> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.handleSuccess(data, 'Profile updated successfully');
    } catch (err: any) {
      return this.handleError(err, 'update user profile');
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<ServiceResponse<UserPreferences | null>> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return this.handleSuccess(data);
    } catch (err: any) {
      return this.handleError(err, 'fetch user preferences');
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<ServiceResponse<UserPreferences | null>> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .upsert({ user_id: userId, ...preferences })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.handleSuccess(data, 'Preferences updated successfully');
    } catch (err: any) {
      return this.handleError(err, 'update user preferences');
    }
  }

  // Get user's anime/manga list
  async getUserList(userId: string, mediaType: 'anime' | 'manga'): Promise<ServiceResponse<UserList[]>> {
    try {
      const { data, error } = await this.supabase
        .from('user_title_lists')
        .select(`
          *,
          titles(*),
          list_statuses(*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return this.handleSuccess(data || []);
    } catch (err: any) {
      return this.handleError(err, `fetch user's ${mediaType} list`);
    }
  }

  // Add item to user's list
  async addToUserList(listItem: {
    user_id: string;
    title_id: string;
    status_id: string;
    media_type: string;
    score?: number;
    episodes_watched?: number;
    chapters_read?: number;
    volumes_read?: number;
    start_date?: string;
    finish_date?: string;
    notes?: string;
  }): Promise<ServiceResponse<UserList | null>> {
    try {
      const { data, error } = await this.supabase
        .from('user_title_lists')
        .insert(listItem)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.handleSuccess(data, 'Added to your list');
    } catch (err: any) {
      return this.handleError(err, 'add to list');
    }
  }

  // Update list item
  async updateListItem(listId: string, updates: Partial<UserList>): Promise<ServiceResponse<UserList | null>> {
    try {
      const { data, error } = await this.supabase
        .from('user_title_lists')
        .update(updates)
        .eq('id', listId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.handleSuccess(data, 'List updated');
    } catch (err: any) {
      return this.handleError(err, 'update list item');
    }
  }

  // Remove from user's list
  async removeFromUserList(listId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('user_title_lists')
        .delete()
        .eq('id', listId);

      if (error) {
        throw error;
      }

      return this.handleSuccess(true, 'Removed from your list');
    } catch (err: any) {
      return this.handleError(err, 'remove from list');
    }
  }

  // Get user's reviews
  async getUserReviews(userId: string): Promise<ServiceResponse<any[]>> {
    try {
      const { data, error } = await this.supabase
        .from('reviews')
        .select(`
          *,
          titles(title, image_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return this.handleSuccess(data || []);
    } catch (err: any) {
      return this.handleError(err, 'fetch user reviews');
    }
  }

  // Create review
  async createReview(review: {
    title_id: string;
    user_id: string;
    title?: string;
    content: string;
    rating?: number;
    spoiler_warning?: boolean;
  }): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.handleSuccess(data, 'Review posted successfully');
    } catch (err: any) {
      return this.handleError(err, 'create review');
    }
  }

  // Follow/unfollow user
  async toggleFollow(followerId: string, followingId: string): Promise<ServiceResponse<boolean>> {
    try {
      // Check if already following
      const { data: existing } = await this.supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

      if (existing) {
        // Unfollow
        const { error } = await this.supabase
          .from('user_follows')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return this.handleSuccess(false, 'Unfollowed user');
      } else {
        // Follow
        const { error } = await this.supabase
          .from('user_follows')
          .insert({ follower_id: followerId, following_id: followingId });

        if (error) throw error;
        return this.handleSuccess(true, 'Following user');
      }
    } catch (err: any) {
      return this.handleError(err, 'update follow status');
    }
  }
}

export const userService = new UserApiService();