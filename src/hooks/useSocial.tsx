import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  activity_type: 'added_to_list' | 'completed' | 'rated' | 'reviewed' | 'started_watching' | 'started_reading';
  anime_id?: string;
  manga_id?: string;
  metadata: any;
  created_at: string;
  user?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

export const useSocial = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [followers, setFollowers] = useState<UserFollow[]>([]);
  const [following, setFollowing] = useState<UserFollow[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);

  // Follow a user
  const followUser = async (userId: string) => {
    if (!user) {
      toast.error('Please sign in to follow users');
      return;
    }

    if (userId === user.id) {
      toast.error("You can't follow yourself");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) throw error;
      toast.success('User followed successfully!');
      await fetchFollowData();
    } catch (error: any) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    } finally {
      setLoading(false);
    }
  };

  // Unfollow a user
  const unfollowUser = async (userId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;
      toast.success('User unfollowed successfully');
      await fetchFollowData();
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is following someone
  const isFollowing = (userId: string) => {
    return following.some(follow => follow.following_id === userId);
  };

  // Get followers/following data
  const fetchFollowData = async () => {
    if (!user) return;

    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('user_follows')
          .select(`
            *,
            profiles:follower_id (full_name, username, avatar_url)
          `)
          .eq('following_id', user.id),
        supabase
          .from('user_follows')
          .select(`
            *,
            profiles:following_id (full_name, username, avatar_url)
          `)
          .eq('follower_id', user.id)
      ]);

      if (followersRes.error) throw followersRes.error;
      if (followingRes.error) throw followingRes.error;

      setFollowers(followersRes.data || []);
      setFollowing(followingRes.data || []);
    } catch (error: any) {
      console.error('Error fetching follow data:', error);
    }
  };

  // Get activity feed (own + followed users)
  const fetchActivityFeed = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(`
          *,
          profiles:user_id (full_name, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityFeed(data as ActivityFeedItem[] || []);
    } catch (error: any) {
      console.error('Error fetching activity feed:', error);
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  // Create activity entry
  const createActivity = async (
    activityType: ActivityFeedItem['activity_type'],
    contentId: string,
    contentType: 'anime' | 'manga',
    metadata: any = {}
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('activity_feed')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          [contentType === 'anime' ? 'anime_id' : 'manga_id']: contentId,
          metadata
        });
    } catch (error: any) {
      console.error('Error creating activity:', error);
    }
  };

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim()) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%, full_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error searching users:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFollowData();
      fetchActivityFeed();
    }
  }, [user]);

  return {
    loading,
    followers,
    following,
    activityFeed,
    followUser,
    unfollowUser,
    isFollowing,
    fetchFollowData,
    fetchActivityFeed,
    createActivity,
    searchUsers
  };
};