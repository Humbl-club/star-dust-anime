import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseStats {
  animeCount: number;
  mangaCount: number;
  userCount: number;
}

export const useStats = () => {
  const [stats, setStats] = useState<DatabaseStats>({
    animeCount: 0,
    mangaCount: 0,
    userCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get anime count
        const { count: animeCount } = await supabase
          .from('anime')
          .select('*', { count: 'exact', head: true });

        // Get manga count
        const { count: mangaCount } = await supabase
          .from('manga')
          .select('*', { count: 'exact', head: true });

        // Get user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        setStats({
          animeCount: animeCount || 0,
          mangaCount: mangaCount || 0,
          userCount: userCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M+`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+`;
    }
    return count.toString();
  };

  return {
    stats,
    loading,
    formatCount
  };
};