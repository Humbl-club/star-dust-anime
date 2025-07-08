import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleGameification } from '@/hooks/useSimpleGameification';

interface ActivityTrackerProps {
  activityType: string;
  points: number;
  metadata?: any;
  triggerOnMount?: boolean;
}

export const ActivityTracker = ({ 
  activityType, 
  points, 
  metadata = {},
  triggerOnMount = true 
}: ActivityTrackerProps) => {
  const { awardPoints } = useSimpleGameification();
  const { user } = useAuth();

  useEffect(() => {
    if (triggerOnMount && user) {
      // Debounce activity tracking to prevent spam
      const timeoutId = setTimeout(() => {
        awardPoints();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [user, triggerOnMount, activityType, points, metadata, awardPoints]);

  return null; // This component doesn't render anything
};

// Hook for manual activity tracking
export const useActivityTracker = () => {
  const { awardPoints } = useSimpleGameification();
  const { user } = useAuth();

  const trackActivity = (activityType: string, points: number, metadata?: any) => {
    if (user) {
      awardPoints();
    }
  };

  return { trackActivity };
};