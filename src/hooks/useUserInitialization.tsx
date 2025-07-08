import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface InitializationResult {
  success: boolean;
  username: string;
  tier: string;
  total_points: number;
  loot_boxes_given: number;
  is_first_time: boolean;
  message: string;
}

export const useUserInitialization = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check and initialize user atomically
  const initializationQuery = useQuery({
    queryKey: ['user-initialization', user?.id],
    queryFn: async (): Promise<InitializationResult> => {
      if (!user?.id) throw new Error('No user found');

      const { data, error } = await supabase.rpc('initialize_user_atomic', {
        user_id_param: user.id
      });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No initialization data returned');

      return data[0];
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Only run once per session
    gcTime: Infinity,
    retry: 1
  });

  // Repair function for broken accounts
  const repairMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user found');

      const { error } = await supabase.rpc('repair_user_gamification', {
        user_id_param: user.id
      });

      if (error) throw error;

      // Then run initialization
      const { data: initData, error: initError } = await supabase.rpc('initialize_user_atomic', {
        user_id_param: user.id
      });

      if (initError) throw initError;
      return initData?.[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-initialization'] });
      if (data?.success) {
        toast.success(`Account repaired! Welcome ${data.username}!`);
      }
    },
    onError: (error) => {
      console.error('Repair failed:', error);
      toast.error('Failed to repair account. Please contact support.');
    }
  });

  return {
    initialization: initializationQuery.data,
    isLoading: initializationQuery.isLoading,
    isError: initializationQuery.isError,
    error: initializationQuery.error,
    isFirstTime: initializationQuery.data?.is_first_time || false,
    isInitialized: initializationQuery.data?.success || false,
    repairAccount: repairMutation.mutate,
    isRepairing: repairMutation.isPending
  };
};