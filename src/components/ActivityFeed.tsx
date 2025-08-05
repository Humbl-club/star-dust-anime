import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Star, Plus, BookOpen, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  title_id?: string;
  metadata: any;
  created_at: string;
  profiles?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  titles?: {
    title: string;
    image_url?: string;
  };
}

interface ActivityFeedProps {
  userId?: string; // If provided, shows activities for specific user
  limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  limit = 20
}) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId, user]);

  const fetchActivities = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Simplified approach - show placeholder activities for now
      // Since activity_feed table doesn't have proper relationships set up
      setActivities([]);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity feed');
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'added_to_list':
        return <Plus className="w-4 h-4" />;
      case 'completed':
        return <Star className="w-4 h-4" />;
      case 'started_watching':
        return <Play className="w-4 h-4" />;
      case 'started_reading':
        return <BookOpen className="w-4 h-4" />;
      case 'rated':
        return <Star className="w-4 h-4" />;
      default:
        return <Heart className="w-4 h-4" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const username = activity.profiles?.username || activity.profiles?.full_name || 'Someone';
    const titleName = activity.titles?.title || 'a title';

    switch (activity.activity_type) {
      case 'added_to_list':
        return `${username} added ${titleName} to their list`;
      case 'completed':
        return `${username} completed ${titleName}`;
      case 'started_watching':
        return `${username} started watching ${titleName}`;
      case 'started_reading':
        return `${username} started reading ${titleName}`;
      case 'rated':
        const score = activity.metadata?.score || 'N/A';
        return `${username} rated ${titleName} ${score}/10`;
      case 'progress_update':
        const progress = activity.metadata?.progress || 'some progress';
        return `${username} updated progress on ${titleName} (${progress})`;
      default:
        return `${username} performed an action on ${titleName}`;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'completed':
        return 'text-green-500';
      case 'added_to_list':
        return 'text-blue-500';
      case 'started_watching':
      case 'started_reading':
        return 'text-purple-500';
      case 'rated':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          {userId ? 'User Activities' : 'Activity Feed'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {userId ? 'No activities yet' : 'Follow some users to see their activities here!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-accent rounded-lg transition-colors">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activity.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {(activity.profiles?.username || activity.profiles?.full_name || '?')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={getActivityColor(activity.activity_type)}>
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-sm">
                    {getActivityText(activity)}
                  </p>
                  
                  {activity.titles?.image_url && (
                    <div className="mt-2">
                      <img
                        src={activity.titles.image_url}
                        alt={activity.titles.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};