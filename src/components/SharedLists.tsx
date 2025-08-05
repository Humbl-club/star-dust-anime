import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Share2, Eye, Link, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AnimeCard } from '@/components/features/AnimeCard';

interface SharedList {
  id: string;
  user_id: string;
  title_id: string;
  media_type: string;
  status_id: string;
  score?: number;
  episodes_watched?: number;
  chapters_read?: number;
  is_public?: boolean;
  title?: {
    id: string;
    title: string;
    image_url?: string;
    score?: number;
    year?: number;
    synopsis?: string;
  };
  anime_details?: any;
  manga_details?: any;
  status?: {
    label: string;
    name: string;
  };
}

interface SharedListsProps {
  userId?: string;
  showToggleControls?: boolean;
}

export const SharedLists: React.FC<SharedListsProps> = ({
  userId,
  showToggleControls = false
}) => {
  const { user } = useAuth();
  const [lists, setLists] = useState<SharedList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareableLink, setShareableLink] = useState('');

  useEffect(() => {
    fetchSharedLists();
  }, [userId, user]);

  const fetchSharedLists = async () => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('user_title_lists')
        .select(`
          *,
          title:titles(*),
          anime_details:anime_details(*),
          manga_details:manga_details(*),
          status:list_statuses(*)
        `)
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      // If viewing someone else's lists, only show public ones
      if (userId && userId !== user?.id) {
        // For now, all lists are considered public since there's no is_public column
        // You would add: .eq('is_public', true)
      }

      const { data, error } = await query;

      if (error) throw error;
      setLists(data || []);

      // Generate shareable link
      if (user && targetUserId === user.id) {
        const baseUrl = window.location.origin;
        setShareableLink(`${baseUrl}/user/${user.email?.split('@')[0] || user.id}`);
      }
    } catch (error) {
      console.error('Error fetching shared lists:', error);
      toast.error('Failed to load lists');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListVisibility = async (listId: string, isPublic: boolean) => {
    try {
      // Since the current schema doesn't have is_public column,
      // this is a placeholder for when that feature is added
      toast.info('List visibility feature coming soon!');
      
      // Future implementation:
      // const { error } = await supabase
      //   .from('user_title_lists')
      //   .update({ is_public: isPublic })
      //   .eq('id', listId);
      
      // if (error) throw error;
      // fetchSharedLists();
      // toast.success(isPublic ? 'List made public' : 'List made private');
    } catch (error) {
      toast.error('Failed to update list visibility');
    }
  };

  const copyShareableLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast.success('Shareable link copied to clipboard!');
  };

  const groupedLists = lists.reduce((acc, list) => {
    const status = list.status?.name || 'unknown';
    if (!acc[status]) acc[status] = [];
    acc[status].push(list);
    return acc;
  }, {} as Record<string, SharedList[]>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {showToggleControls ? 'My Lists' : 'Shared Lists'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {showToggleControls ? 'My Lists' : 'Shared Lists'}
          </CardTitle>
          
          {showToggleControls && shareableLink && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyShareableLink}
              >
                <Link className="w-4 h-4 mr-2" />
                Share Profile
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {lists.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No lists to display</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedLists).map(([status, statusLists]) => (
              <div key={status}>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold capitalize">
                    {status.replace('_', ' ')}
                  </h3>
                  <Badge variant="secondary">
                    {statusLists.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {statusLists.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="relative">
                        <AnimeCard
                          anime={{
                            id: item.title?.id || '',
                            title: item.title?.title || '',
                            image_url: item.title?.image_url || '',
                            score: item.title?.score || 0,
                            year: item.title?.year,
                            synopsis: item.title?.synopsis || '',
                            episodes: item.anime_details?.episodes,
                            type: item.media_type === 'anime' ? 'TV' : 'Manga',
                            genres: [],
                            status: item.anime_details?.status || item.manga_details?.status
                          }}
                        />
                        
                        {showToggleControls && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-background/80 backdrop-blur-sm rounded-full p-1">
                            <Switch
                              checked={true} // Placeholder - would use item.is_public
                              onCheckedChange={(checked) => toggleListVisibility(item.id, checked)}
                            />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        {item.score && (
                          <div>Score: {item.score}/10</div>
                        )}
                        {item.media_type === 'anime' && item.episodes_watched && (
                          <div>Progress: {item.episodes_watched}/{item.anime_details?.episodes || '?'}</div>
                        )}
                        {item.media_type === 'manga' && item.chapters_read && (
                          <div>Progress: {item.chapters_read}/{item.manga_details?.chapters || '?'}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};