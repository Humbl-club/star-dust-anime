
import React, { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
        
        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          console.log('useAuthState: User signed out, clearing state');
          setUser(null);
          setSession(null);
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

  return { user, session, loading };
}
