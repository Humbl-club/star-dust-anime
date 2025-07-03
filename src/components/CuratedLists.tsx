import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Heart, 
  Star, 
  Users, 
  ExternalLink,
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Share2,
  Bookmark
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CuratedListsProps {
  animeId: string;
}

interface CuratedList {
  id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  follower_count: number;
  view_count: number;
  created_at: string;
  influencer: {
    id: string;
    display_name: string;
    avatar_url?: string;
    verified: boolean;
    follower_count: number;
  };
  items_count: number;
}

interface VideoContent {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  video_url: string;
  platform: string;
  duration_seconds?: number;
  view_count: number;
  like_count: number;
  published_at: string;
  influencer: {
    id: string;
    display_name: string;
    avatar_url?: string;
    verified: boolean;
  };
  tags: string[];
}

export const CuratedLists = ({ animeId }: CuratedListsProps) => {
  const [lists, setLists] = useState<CuratedList[]>([]);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCuratedContent();
  }, [animeId]);

  const fetchCuratedContent = async () => {
    try {
      // Fetch curated lists containing this anime
      const { data: listsData, error: listsError } = await supabase
        .from('curated_lists')
        .select(`
          *,
          influencer:influencers(*),
          curated_list_items!inner(anime_id)
        `)
        .eq('curated_list_items.anime_id', animeId)
        .eq('is_public', true)
        .order('follower_count', { ascending: false })
        .limit(10);

      if (listsError) throw listsError;

      // Transform data to include items_count
      const transformedLists = listsData?.map(list => ({
        ...list,
        items_count: Array.isArray(list.curated_list_items) ? list.curated_list_items.length : 0
      })) || [];

      // Fetch video content about this anime
      const { data: videosData, error: videosError } = await supabase
        .from('video_content')
        .select(`
          *,
          influencer:influencers(*)
        `)
        .eq('anime_id', animeId)
        .order('published_at', { ascending: false })
        .limit(20);

      if (videosError) throw videosError;

      setLists(transformedLists);
      setVideos(videosData || []);
    } catch (error) {
      console.error('Error fetching curated content:', error);
      toast.error('Failed to load curated content');
    } finally {
      setLoading(false);
    }
  };

  const followList = async (listId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to follow lists');
        return;
      }

      const { error } = await supabase
        .from('list_follows')
        .insert({ list_id: listId, user_id: user.id });

      if (error) throw error;
      
      toast.success('Following list!');
      fetchCuratedContent(); // Refresh to update follower count
    } catch (error) {
      console.error('Error following list:', error);
      toast.error('Failed to follow list');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Show empty state when no data available
  const displayLists = lists;
  const displayVideos = videos;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/20 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="lists" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lists">Curated Lists</TabsTrigger>
          <TabsTrigger value="videos">Creator Videos</TabsTrigger>
        </TabsList>

        <TabsContent value="lists" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Featured in Curated Lists</h3>
              <Link to="/curated-lists">
                <Button variant="outline" size="sm">
                  View All Lists
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {displayLists.length > 0 ? (
              <div className="grid gap-6">
                {displayLists.map((list) => (
                  <Card key={list.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={list.cover_image_url} 
                            alt={list.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer">
                                {list.title}
                              </h4>
                              <p className="text-muted-foreground text-sm mt-1">
                                {list.description}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => followList(list.id)}
                              className="ml-4"
                            >
                              <Heart className="w-4 h-4 mr-1" />
                              Follow
                            </Button>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              {list.items_count} items
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {(list.follower_count / 1000).toFixed(1)}K followers
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {(list.view_count / 1000).toFixed(1)}K views
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={list.influencer.avatar_url} />
                              <AvatarFallback>{list.influencer.display_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{list.influencer.display_name}</span>
                              {list.influencer.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="w-3 h-3 mr-1 text-primary" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <Star className="w-16 h-16 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">No curated lists yet</h3>
                      <p className="text-muted-foreground">
                        This anime hasn't been featured in any curated lists yet.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Creator Videos</h3>
              <Link to="/creator-videos">
                <Button variant="outline" size="sm">
                  View All Videos
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {displayVideos.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {displayVideos.map((video) => (
                  <Card key={video.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <div className="relative">
                      <div className="aspect-video rounded-t-lg overflow-hidden">
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Play className="w-6 h-6 text-primary-foreground ml-1" />
                          </div>
                        </div>
                      </div>
                      {video.duration_seconds && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration_seconds)}
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h4>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={video.influencer.avatar_url} />
                          <AvatarFallback className="text-xs">{video.influencer.display_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{video.influencer.display_name}</span>
                          {video.influencer.verified && (
                            <Star className="w-3 h-3 text-primary" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {(video.view_count / 1000).toFixed(0)}K views
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {(video.like_count / 1000).toFixed(1)}K
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(video.published_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {video.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <Play className="w-16 h-16 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">No videos available</h3>
                      <p className="text-muted-foreground">
                        No creator videos found for this anime yet.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};