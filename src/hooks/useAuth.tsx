import { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { AuthContext } from '@/contexts/AuthContext';
import { AuthContextType } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthValidation } from '@/hooks/useAuthValidation';
import { authService } from '@/services/authService';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuthState();
  const { validatePasswordStrength, validateEmailFormat } = useAuthValidation();

  // Track user context in Sentry
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp: authService.signUp,
    signIn: authService.signIn,
    signInWithGoogle: authService.signInWithGoogle,
    signOut: authService.signOut,
    resendConfirmation: authService.resendConfirmation,
    validatePasswordStrength,
    validateEmailFormat,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { useAuth } from '@/contexts/AuthContext';