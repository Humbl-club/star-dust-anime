
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('useAuthState: Initializing auth state...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('useAuthState: Error getting initial session:', error);
        }
        
        if (mounted) {
          console.log('useAuthState: Initial session:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('useAuthState: Exception during auth initialization:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('useAuthState: Auth state changed:', event, session?.user?.email);
        
        // Update state
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          console.log('useAuthState: User signed out, clearing state');
          setUser(null);
          setSession(null);
        }
      }
    );

    return () => {
      mounted = false;
      console.log('useAuthState: Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
};
