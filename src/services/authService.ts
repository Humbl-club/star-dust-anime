import { supabase } from '@/integrations/supabase/client';
import { validatePassword, validateEmail, sanitizeInput } from '@/utils/authValidation';
import { AuthResponse } from '@/types/auth';
import { generateCorrelationId, classifyError, logError, formatErrorForUser } from '@/utils/errorUtils';

export const authService = {
  async signUp(email: string, password: string): Promise<AuthResponse> {
    const correlationId = generateCorrelationId();
    
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
      
      console.log('AuthService: Starting signup process for:', sanitizedEmail);
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            signup_source: 'web',
            user_agent: navigator.userAgent,
            password_strength_score: passwordValidation.score
          }
        }
      });

      console.log('AuthService: Signup response:', { data, error });

      // Enhanced error handling with classification
      if (error) {
        const classifiedError = classifyError(error, correlationId, 'auth_signup');
        await logError(classifiedError, error);
        
        // Provide more user-friendly error messages
        if (error.message.includes('User already registered')) {
          return { error: { message: `An account with this email already exists. Please sign in instead.\n\nError ID: ${correlationId.slice(-8).toUpperCase()}` } };
        }
        if (error.message.includes('Password should be at least')) {
          return { error: { message: `Password must be at least 6 characters long.\n\nError ID: ${correlationId.slice(-8).toUpperCase()}` } };
        }
        if (error.message.includes('Unable to validate email address')) {
          return { error: { message: `Please enter a valid email address.\n\nError ID: ${correlationId.slice(-8).toUpperCase()}` } };
        }
        
        return { error: { message: formatErrorForUser(classifiedError) } };
      }

      // Always set justSignedUp flag for new users
      sessionStorage.setItem('justSignedUp', 'true');
      
      if (data.user && !data.session) {
        // User created but needs email confirmation
        sessionStorage.setItem('pendingEmail', email);
        
        // Send verification email immediately after successful signup
        console.log('AuthService: Sending verification email...');
try {
          // Queue verification email instead of sending directly
          const { error: queueError } = await supabase
            .from('email_queue')
            .insert({
              email: sanitizedEmail,
              user_id: data.user.id,
              email_type: 'signup',
              metadata: {
                redirect_to: redirectUrl
              },
              correlation_id: crypto.randomUUID()
            });
          
          if (queueError) {
            console.error('AuthService: Failed to queue email:', queueError);
          }
        } catch (emailTriggerError) {
          console.error('AuthService: Exception during email sending:', emailTriggerError);
        }
        
        return { 
          error: null,
          needsConfirmation: true,
          message: 'Please check your email to confirm your account'
        };
      }

      // User created and confirmed (confirmations disabled)
      return { error: null, data };
    } catch (err) {
      const classifiedError = classifyError(err, correlationId, 'auth_signup_exception');
      await logError(classifiedError, err);
      
      return { error: { message: formatErrorForUser(classifiedError) } };
    }
  },

  async signIn(email: string, password: string): Promise<{ error: any }> {
    const correlationId = generateCorrelationId();
    
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
        const classifiedError = classifyError(error, correlationId, 'auth_signin');
        await logError(classifiedError, error);
        
        // Provide more user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: `Invalid email or password. Please try again.\n\nError ID: ${correlationId.slice(-8).toUpperCase()}` } };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: { message: `Please check your email and confirm your account before signing in.\n\nError ID: ${correlationId.slice(-8).toUpperCase()}` } };
        }
        if (error.message.includes('Too many requests')) {
          return { error: { message: `Too many sign-in attempts. Please wait a moment and try again.\n\nError ID: ${correlationId.slice(-8).toUpperCase()}` } };
        }

        return { error: { message: formatErrorForUser(classifiedError) } };
      }

      return { error: null };
    } catch (err) {
      const classifiedError = classifyError(err, correlationId, 'auth_signin_exception');
      await logError(classifiedError, err);
      
      return { error: { message: formatErrorForUser(classifiedError) } };
    }
  },

  async signInWithGoogle(): Promise<{ error: any }> {
    const correlationId = generateCorrelationId();
    
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
        const classifiedError = classifyError(error, correlationId, 'auth_google_signin');
        await logError(classifiedError, error);
        
        return { error: { message: formatErrorForUser(classifiedError) } };
      }
      
      return { error: null };
    } catch (err) {
      const classifiedError = classifyError(err, correlationId, 'auth_google_signin_exception');
      await logError(classifiedError, err);
      
      return { error: { message: formatErrorForUser(classifiedError) } };
    }
  },

  async signOut(): Promise<{ error: any }> {
    const correlationId = generateCorrelationId();
    
    try {
      console.log('AuthService: Starting sign out process...');
      
      // Clear local storage
      localStorage.removeItem('justSignedUp');
      localStorage.removeItem('pendingEmail');
      sessionStorage.removeItem('justSignedUp');
      sessionStorage.removeItem('pendingEmail');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        const classifiedError = classifyError(error, correlationId, 'auth_signout');
        await logError(classifiedError, error);
        
        return { error: { message: formatErrorForUser(classifiedError) } };
      }
      
      console.log('AuthService: Sign out successful');
      return { error: null };
    } catch (err) {
      const classifiedError = classifyError(err, correlationId, 'auth_signout_exception');
      await logError(classifiedError, err);
      
      return { error: { message: formatErrorForUser(classifiedError) } };
    }
  },

  async resendConfirmation(email: string): Promise<{ error: any; message?: string }> {
    const correlationId = generateCorrelationId();
    
    try {
      // Sanitize email input
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      
      // Validate email format
      const emailValidation = validateEmail(sanitizedEmail);
      if (!emailValidation.isValid) {
        return { 
          error: { message: emailValidation.errors[0] || 'Please enter a valid email address' },
          message: 'Invalid email format'
        };
      }

      console.log('Resending confirmation to:', sanitizedEmail);
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { 
          error: { message: 'User not authenticated' },
          message: 'Authentication required'
        };
      }
      
      // Queue resend confirmation email
      const { error } = await supabase
        .from('email_queue')
        .insert({
          email: sanitizedEmail,
          user_id: user.id,
          email_type: 'resend_confirmation',
          metadata: {
            redirect_to: window.location.origin
          },
          correlation_id: crypto.randomUUID()
        });

      if (error) {
        const classifiedError = classifyError(error, correlationId, 'auth_resend_confirmation');
        await logError(classifiedError, error);
        
        return { 
          error: { message: formatErrorForUser(classifiedError) },
          message: 'Failed to resend email'
        };
      }

      return { 
        error: null,
        message: 'Confirmation email sent! Please check your inbox.'
      };
    } catch (error: unknown) {
      const classifiedError = classifyError(error, correlationId, 'auth_resend_confirmation_exception');
      await logError(classifiedError, error);
      
      return { 
        error: { message: formatErrorForUser(classifiedError) },
        message: 'Unexpected error'
      };
    }
  }
};
