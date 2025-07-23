import React, { useContext, ReactNode } from 'react';
import { useAuthState } from './useAuthState';
import { useAuthValidation } from '@/hooks/useAuthValidation';
import { authService } from '@/services/authService';
import { AuthContext, AuthContextType } from './authContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, session, loading } = useAuthState();
  const { validatePasswordStrength, validateEmailFormat } = useAuthValidation();

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};