import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDataCheck = (contentType: 'anime' | 'manga') => {
  const [isEmpty, setIsEmpty] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isPopulating, setIsPopulating] = useState(false);
  const syncTriggeredRef = useRef(false);

  useEffect(() => {
    const checkData = async () => {
      try {
        // Check specific table based on content type
        const tableName = contentType === 'anime' ? 'anime_details' : 'manga_details';
        
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`Error checking ${contentType} data:`, error);
          
          // Check if it's a missing table error
          if (error.code === '42P01') {
            toast.error(`Database table '${tableName}' not found. Please run migrations.`);
          }
          throw error;
        }
        
        console.log(`${contentType} count:`, count);
        setIsEmpty(count === 0);
        
        // Only trigger sync once per session
        if (count === 0 && !syncTriggeredRef.current) {
          syncTriggeredRef.current = true;
          setIsPopulating(true);
          
          toast.info(`Starting ${contentType} database population...`, {
            description: "This is a one-time setup that may take a few minutes.",
            duration: Infinity,
            id: `${contentType}-sync`
          });
          
          // Use the ultra-fast-complete-sync function
          const { error: syncError } = await supabase.functions.invoke('ultra-fast-complete-sync', {
            body: { 
              contentType: contentType,
              pages: 10
            }
          });
          
          if (syncError) {
            console.error('Sync error:', syncError);
            toast.error(`Failed to populate ${contentType} database`, {
              description: syncError.message
            });
          } else {
            toast.success(`${contentType} database populated successfully!`, {
              id: `${contentType}-sync`
            });
            // Trigger a re-check after successful sync
            setTimeout(() => window.location.reload(), 2000);
          }
          
          setIsPopulating(false);
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

  return { isEmpty, isChecking, isPopulating };
};