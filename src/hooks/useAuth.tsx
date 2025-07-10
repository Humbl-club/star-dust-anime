import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword, validateEmail, sanitizeInput } from '@/utils/authValidation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any; needsConfirmation?: boolean; message?: string; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  validatePasswordStrength: (password: string) => { isValid: boolean; score: number; errors: string[]; suggestions: string[] };
  validateEmailFormat: (email: string) => { isValid: boolean; errors: string[]; suggestions: string[] };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const sanitizedPassword = sanitizeInput(password);

      // Validate email format
      const emailValidation = validateEmail(sanitizedEmail);
      if (!emailValidation.isValid) {
        return { 
          error: { 
            message: emailValidation.errors[0] || 'Invalid email format' 
          } 
        };
      }

      // Validate password strength
      const passwordValidation = validatePassword(sanitizedPassword);
      if (!passwordValidation.isValid) {
        return { 
          error: { 
            message: passwordValidation.errors[0] || 'Password does not meet security requirements' 
          } 
        };
      }

      // More robust redirect URL handling for mobile/iPad
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
        options: {
          emailRedirectTo: redirectUrl,
          // Add mobile-friendly options
          data: {
            signup_source: 'web',
            user_agent: navigator.userAgent,
            password_strength_score: passwordValidation.score
          }
        }
      });

      // Enhanced error handling
      if (error) {
        console.error('Signup error:', error);
        
        // Provide more user-friendly error messages
        if (error.message.includes('User already registered')) {
          return { error: { message: 'An account with this email already exists. Please sign in instead.' } };
        }
        if (error.message.includes('Password should be at least')) {
          return { error: { message: 'Password must be at least 6 characters long.' } };
        }
        if (error.message.includes('Unable to validate email address')) {
          return { error: { message: 'Please enter a valid email address.' } };
        }
        
        return { error: { message: error.message || 'Failed to create account' } };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { 
          error: null,
          needsConfirmation: true,
          message: 'Please check your email to confirm your account'
        };
      }

      return { error: null, data };
    } catch (err) {
      console.error('Signup exception:', err);
      return { error: { message: 'An unexpected error occurred during signup' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const sanitizedPassword = sanitizeInput(password);

      // Basic validation
      if (!sanitizedEmail || !sanitizedPassword) {
        return { error: { message: 'Email and password are required' } };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (error) {
        // Provide more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Invalid email or password. Please try again.' } };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: { message: 'Please check your email and confirm your account before signing in.' } };
        }
        if (error.message.includes('Too many requests')) {
          return { error: { message: 'Too many sign-in attempts. Please wait a moment and try again.' } };
        }

        return { error: { message: error.message || 'Failed to sign in' } };
      }

      return { error: null };
    } catch (err) {
      console.error('Signin exception:', err);
      return { error: { message: 'An unexpected error occurred during sign in' } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Better mobile redirect handling
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Mobile-friendly options for iPad/Safari
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('Google signin error:', error);
      }
      
      return { error };
    } catch (err) {
      console.error('Google signin exception:', err);
      return { error: { message: 'Failed to sign in with Google' } };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const validatePasswordStrength = (password: string) => {
    return validatePassword(password);
  };

  const validateEmailFormat = (email: string) => {
    return validateEmail(email);
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    validatePasswordStrength,
    validateEmailFormat,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}