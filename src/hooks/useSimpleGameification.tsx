// Simplified gamification hook that uses the new initialization system
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useSimpleGameification = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-gamification-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_user_gamification_summary', {
        user_id_param: user.id
      });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user?.id,
  });

  return {
    stats: stats ? {
      loginStreak: 0, // No more login streak
      currentUsername: stats.current_username || 'Unknown',
      usernameTier: stats.username_tier || 'COMMON'
    } : null,
    loading: isLoading,
    // Simplified functions - no complex gamification
    refreshData: () => Promise.resolve(),
  };
};