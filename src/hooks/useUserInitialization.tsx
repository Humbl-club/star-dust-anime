import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface InitializationResult {
  success: boolean;
  username: string;
  tier: string;
  is_first_time: boolean;
  needs_welcome: boolean;
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

      console.log('Starting account repair for user:', user.id);
      
      // Run initialization which will handle repair automatically
      const { data: initData, error: initError } = await supabase.rpc('initialize_user_atomic', {
        user_id_param: user.id
      });

      console.log('Repair response:', { initData, initError });

      if (initError) {
        console.error('Database function error:', initError);
        throw new Error(initError.message || 'Database function failed');
      }

      if (!initData || initData.length === 0) {
        throw new Error('No data returned from repair function');
      }

      return initData[0];
    },
    onSuccess: (data) => {
      console.log('Repair successful:', data);
      queryClient.invalidateQueries({ queryKey: ['user-initialization'] });
      queryClient.refetchQueries({ queryKey: ['user-initialization'] });
      
      if (data?.success) {
        toast.success(`Account repaired! Welcome ${data.username}!`);
      } else {
        toast.error(data?.message || 'Repair completed but with issues');
      }
    },
    onError: (error) => {
      console.error('Repair failed:', error);
      toast.error(`Failed to repair account: ${error.message}`);
    }
  });

  return {
    initialization: initializationQuery.data,
    isLoading: initializationQuery.isLoading,
    isError: initializationQuery.isError,
    error: initializationQuery.error,
    isFirstTime: initializationQuery.data?.is_first_time || false,
    needsWelcome: initializationQuery.data?.needs_welcome || false,
    isInitialized: initializationQuery.data?.success || false,
    repairAccount: repairMutation.mutate,
    isRepairing: repairMutation.isPending
  };
};