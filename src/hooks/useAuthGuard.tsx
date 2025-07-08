import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthGuardOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  showToast?: boolean;
  onAuthRequired?: () => void;
  onAuthSuccess?: () => void;
}

export const useAuthGuard = ({
  requireAuth = true,
  redirectTo = '/auth',
  showToast = true,
  onAuthRequired,
  onAuthSuccess
}: AuthGuardOptions = {}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      setIsAuthorized(false);
      
      if (showToast) {
        toast.error('Please sign in to access this feature');
      }
      
      onAuthRequired?.();
      navigate(redirectTo, { replace: true });
      return;
    }

    if (requireAuth && user) {
      setIsAuthorized(true);
      onAuthSuccess?.();
      return;
    }

    if (!requireAuth) {
      setIsAuthorized(true);
      return;
    }
  }, [user, loading, requireAuth, redirectTo, showToast, navigate, onAuthRequired, onAuthSuccess]);

  return {
    isAuthorized,
    isLoading: loading,
    user
  };
};