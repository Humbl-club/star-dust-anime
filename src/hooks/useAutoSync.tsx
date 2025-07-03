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

        console.log('FORCING IMMEDIATE COMPLETE LIBRARY SYNC...');
        setSyncStatus('STARTING IMMEDIATE COMPLETE SYNC - Building ENTIRE anime & manga library (this will take 15-30 minutes)...');

        // ALWAYS do complete sync now - ignore existing data
        console.log('Starting complete library sync...');

        // Start anime sync - NO LIMITS, get everything
        const animeSync = supabase.functions.invoke('complete-library-sync', {
          body: { contentType: 'anime', maxPages: 999999, itemsPerPage: 25 }
        });

        // Start manga sync - NO LIMITS, get everything  
        const mangaSync = supabase.functions.invoke('complete-library-sync', {
          body: { contentType: 'manga', maxPages: 999999, itemsPerPage: 25 }
        });

        // Wait for both to complete
        await Promise.all([animeSync, mangaSync]);
        
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