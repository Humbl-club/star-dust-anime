import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAutoSync = () => {
  useEffect(() => {
    let initialized = false;

    const initializeApp = async () => {
      if (initialized) return;
      initialized = true;

      try {
        // Check if we're in development or if auto-sync is disabled
        const skipAutoSync = localStorage.getItem('skip-auto-sync') === 'true';
        if (skipAutoSync) return;

        console.log('Checking for automatic data sync...');

        // Trigger auto-initialization in the background
        supabase.functions.invoke('auto-initialize').catch(error => {
          console.log('Auto-sync check completed:', error.message || 'Background sync active');
        });

        // Set flag to prevent multiple calls
        localStorage.setItem('auto-sync-checked', Date.now().toString());

      } catch (error) {
        console.log('Auto-sync initialization check completed');
      }
    };

    // Check if we've already done this recently (within 1 hour)
    const lastCheck = localStorage.getItem('auto-sync-checked');
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    if (!lastCheck || parseInt(lastCheck) < oneHourAgo) {
      // Small delay to ensure components are mounted
      setTimeout(initializeApp, 2000);
    }

    // Set up periodic background checks (every 30 minutes)
    const interval = setInterval(() => {
      supabase.functions.invoke('auto-initialize').catch(() => {
        // Silent background check
      });
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);
};

export default useAutoSync;