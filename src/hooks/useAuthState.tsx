
import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SessionManager } from '@/utils/encryptionUtils';
import { logSecurityEvent } from '@/utils/securityUtils';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);

  // Session timeout management
  const checkSessionTimeout = useCallback(() => {
    if (!session) return;
    
    const remainingTime = SessionManager.getRemainingTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (remainingTime <= fiveMinutes && remainingTime > 0) {
      setSessionTimeoutWarning(true);
    } else if (remainingTime <= 0) {
      // Session expired
      logSecurityEvent({
        type: 'session_timeout',
        severity: 'info',
        message: 'Session expired due to inactivity'
      });
      
      supabase.auth.signOut();
      setSessionTimeoutWarning(false);
    }
  }, [session]);

  useEffect(() => {
    console.log('useAuthState: Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuthState: Auth state changed:', event, session?.user?.email);
        
        // Update state
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle different auth events
        if (event === 'SIGNED_IN') {
          // Create secure session
          if (session?.user) {
            SessionManager.createSession({
              id: session.user.id,
              email: session.user.email
            });
            
            logSecurityEvent({
              type: 'session_created',
              severity: 'info',
              message: 'New session created'
            });
          }
          setSessionTimeoutWarning(false);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('useAuthState: User signed out, clearing state');
          SessionManager.clearSession();
          setUser(null);
          setSession(null);
          setSessionTimeoutWarning(false);
        }
        
        if (event === 'TOKEN_REFRESHED') {
          // Update session activity
          SessionManager.updateActivity();
        }
      }
    );

    // Check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('useAuthState: Error getting session:', error);
        } else {
          console.log('useAuthState: Initial session:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('useAuthState: Exception getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log('useAuthState: Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  // Set up session timeout checking
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(checkSessionTimeout, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [session, checkSessionTimeout]);

  return { 
    user, 
    session, 
    loading, 
    sessionTimeoutWarning,
    extendSession: () => {
      SessionManager.updateActivity();
      setSessionTimeoutWarning(false);
    }
  };
}
