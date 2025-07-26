import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDataCheck = (contentType: 'anime' | 'manga') => {
  const [isEmpty, setIsEmpty] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkData = async () => {
      try {
        // Check the titles table with content type filter
        const tableName = contentType === 'anime' ? 'anime_details' : 'manga_details';
        
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`Error checking ${contentType} data:`, error);
          throw error;
        }
        
        console.log(`${contentType} count:`, count);
        setIsEmpty(count === 0);
        
        if (count === 0) {
          console.log(`No ${contentType} data found, triggering auto-population...`);
          
          // Trigger auto-population
          const { error: syncError } = await supabase.functions.invoke('ultra-fast-complete-sync', {
            body: {
              contentType: contentType,
              pages: 5
            }
          });
          
          if (syncError) {
            console.error('Sync error:', syncError);
            toast.error(`Failed to start ${contentType} sync: ${syncError.message}`);
          } else {
            toast.success(`Starting ${contentType} database population...`, {
              description: "This may take a few minutes. Data will appear automatically when ready."
            });
          }
        }
      } catch (error) {
        console.error('Error checking data:', error);
        toast.error(`Failed to check ${contentType} database status`);
      } finally {
        setIsChecking(false);
      }
    };

    checkData();
  }, [contentType]);

  return { isEmpty, isChecking };
};