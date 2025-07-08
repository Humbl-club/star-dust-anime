import { useEffect } from 'react';
import { useGameification } from '@/hooks/useGameification';
import { useAuth } from '@/hooks/useAuth';

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
  const { awardPoints } = useGameification();
  const { user } = useAuth();

  useEffect(() => {
    if (triggerOnMount && user) {
      // Debounce activity tracking to prevent spam
      const timeoutId = setTimeout(() => {
        awardPoints(activityType, points, metadata);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [user, triggerOnMount, activityType, points, metadata, awardPoints]);

  return null; // This component doesn't render anything
};

// Hook for manual activity tracking
export const useActivityTracker = () => {
  const { awardPoints } = useGameification();
  const { user } = useAuth();

  const trackActivity = (activityType: string, points: number, metadata?: any) => {
    if (user) {
      awardPoints(activityType, points, metadata);
    }
  };

  return { trackActivity };
};