import { supabase } from '@/integrations/supabase/client';
import { validatePassword, validateEmail, sanitizeInput } from '@/utils/authValidation';
import { AuthResponse } from '@/types/auth';

export const authService = {
  async signUp(email: string, password: string): Promise<AuthResponse> {
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
      const redirectUrl = `${baseUrl}/`;
      
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

      // Always set justSignedUp flag for new users
      sessionStorage.setItem('justSignedUp', 'true');
      
      if (data.user && !data.session) {
        // User created but needs email confirmation
        sessionStorage.setItem('pendingEmail', email);
        return { 
          error: null,
          needsConfirmation: true,
          message: 'Please check your email to confirm your account'
        };
      }

      // User created and confirmed (confirmations disabled)
      return { error: null, data };
    } catch (err) {
      console.error('Signup exception:', err);
      return { error: { message: 'An unexpected error occurred during signup' } };
    }
  },

  async signIn(email: string, password: string): Promise<{ error: any }> {
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
  },

  async signInWithGoogle(): Promise<{ error: any }> {
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
  },

  async signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async resendConfirmation(email: string): Promise<{ error: any; message?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: sanitizeInput(email),
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        return { error };
      }

      return { 
        error: null, 
        message: 'Confirmation email sent! Please check your inbox.' 
      };
    } catch (error: any) {
      return {
        error: {
          message: 'Failed to resend confirmation email.'
        }
      };
    }
  }
};