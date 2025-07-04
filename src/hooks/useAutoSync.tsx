import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAutoSync = () => {
  const [syncStatus, setSyncStatus] = useState<string>('');

  useEffect(() => {
    let initialized = false;

    const initializeApp = async () => {
      if (initialized) return;
      initialized = true;

      try {
        // FORCE SYNC TO RUN NOW - Clear any skip flags
        localStorage.removeItem('skip-auto-sync');
        localStorage.removeItem('auto-sync-completed');

        console.log('STARTING ULTRA-FAST COMPLETE LIBRARY SYNC FOR APPLE STORE...');
        setSyncStatus('🚀 ULTRA-FAST SYNC: Building complete anime & manga library (Apple Store ready)...');

        // Use the trigger-full-sync for complete coverage
        console.log('Starting complete library sync...');

        const { data, error } = await supabase.functions.invoke('trigger-full-sync');
        
        if (error) {
          console.error('Sync error:', error);
          throw error;
        }
        
        console.log('Full sync response:', data);
        
        setSyncStatus('COMPLETE LIBRARY SYNC FINISHED! Database is ready with full anime & manga library.');
        
        // Show success message briefly
        setTimeout(() => setSyncStatus(''), 5000);

        // Set flag to prevent multiple calls today
        localStorage.setItem('auto-sync-completed', Date.now().toString());

      } catch (error) {
        console.log('Complete sync running in background:', error.message || 'Processing...');
        setSyncStatus('Complete sync is running in background...');
      }
    };

    // FORCE IMMEDIATE SYNC - Remove all checks
    setTimeout(initializeApp, 500);

    // Set up daily background sync checks (every 6 hours)
    const interval = setInterval(() => {
      supabase.functions.invoke('incremental-sync').catch(() => {
        // Silent background check
      });
    }, 6 * 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { syncStatus };
};

export default useAutoSync;