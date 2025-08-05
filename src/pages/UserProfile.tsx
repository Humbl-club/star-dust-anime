import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/api/userService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, UserCheck, UserPlus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { SEOMetaTags } from '@/components/SEOMetaTags';
import { AnimeCard } from '@/components/features/AnimeCard';

interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  created_at: string;
  verification_status: string;
}

interface UserStats {
  total_anime: number;
  total_manga: number;
  average_score: number;
  watching: number;
  reading: number;
  completed: number;
}

interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [followStats, setFollowStats] = useState<FollowStats | null>(null);
  const [userLists, setUserLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lists');

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    if (!username) return;
    
    setIsLoading(true);
    try {
      // Fetch user profile by username
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profiles) {
        toast.error('User not found');
        navigate('/');
        return;
      }

      setProfile(profiles);

      // Fetch user stats
      const { data: stats, error: statsError } = await supabase
        .from('user_title_lists')
        .select(`
          media_type,
          score,
          status:list_statuses(name)
        `)
        .eq('user_id', profiles.id);

      if (!statsError && stats) {
        const animeCount = stats.filter(s => s.media_type === 'anime').length;
        const mangaCount = stats.filter(s => s.media_type === 'manga').length;
        const avgScore = stats.reduce((sum, s) => sum + (s.score || 0), 0) / stats.length;
        const watching = stats.filter(s => s.status?.name === 'watching').length;
        const reading = stats.filter(s => s.status?.name === 'reading').length;
        const completed = stats.filter(s => s.status?.name === 'completed').length;

        setUserStats({
          total_anime: animeCount,
          total_manga: mangaCount,
          average_score: Math.round(avgScore * 10) / 10,
          watching,
          reading,
          completed
        });
      }

      // Fetch follow stats
      if (user) {
        const [followersRes, followingRes, isFollowingRes] = await Promise.all([
          supabase.from('user_follows').select('id').eq('following_id', profiles.id),
          supabase.from('user_follows').select('id').eq('follower_id', profiles.id),
          supabase.from('user_follows').select('id').eq('follower_id', user.id).eq('following_id', profiles.id).maybeSingle()
        ]);

        setFollowStats({
          followers_count: followersRes.data?.length || 0,
          following_count: followingRes.data?.length || 0,
          is_following: !!isFollowingRes.data
        });
      }

      // Fetch public lists
      const { data: lists, error: listsError } = await supabase
        .from('user_title_lists')
        .select(`
          *,
          title:titles(*),
          anime_details:anime_details(*),
          manga_details:manga_details(*),
          status:list_statuses(*)
        `)
        .eq('user_id', profiles.id)
        .limit(12);

      if (!listsError) {
        setUserLists(lists || []);
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !profile) {
      toast.error('Please sign in to follow users');
      return;
    }

    if (user.id === profile.id) {
      toast.error("You can't follow yourself");
      return;
    }

    try {
      const result = await userService.toggleFollow(user.id, profile.id);
      if (result.success) {
        toast.success(result.data ? 'Following user' : 'Unfollowed user');
        setFollowStats(prev => prev ? {
          ...prev,
          is_following: result.data,
          followers_count: prev.followers_count + (result.data ? 1 : -1)
        } : null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">User Not Found</h1>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMetaTags 
        title={`${profile.username || profile.full_name}'s Profile`}
        description={profile.bio || `Check out ${profile.username || profile.full_name}'s anime and manga lists`}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center md:items-start">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="text-2xl">
                      {(profile.username || profile.full_name || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {user && user.id !== profile.id && followStats && (
                    <Button
                      onClick={handleFollowToggle}
                      variant={followStats.is_following ? "outline" : "default"}
                      size="sm"
                    >
                      {followStats.is_following ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-foreground">
                      {profile.username || profile.full_name}
                    </h1>
                    {profile.verification_status === 'verified' && (
                      <Badge variant="secondary">Verified</Badge>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                    {followStats && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {followStats.followers_count} followers · {followStats.following_count} following
                      </div>
                    )}
                  </div>

                  {userStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{userStats.total_anime}</div>
                        <div className="text-sm text-muted-foreground">Anime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{userStats.total_manga}</div>
                        <div className="text-sm text-muted-foreground">Manga</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{userStats.average_score}</div>
                        <div className="text-sm text-muted-foreground">Avg Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{userStats.completed}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Lists */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lists">Recent Lists</TabsTrigger>
              <TabsTrigger value="anime">Anime</TabsTrigger>
              <TabsTrigger value="manga">Manga</TabsTrigger>
            </TabsList>

            <TabsContent value="lists" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userLists.map((item) => (
                  <div key={item.id} className="space-y-2">
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
                    <div className="text-sm text-muted-foreground">
                      Status: {item.status?.label || 'Unknown'}
                      {item.score && ` • Score: ${item.score}/10`}
                    </div>
                  </div>
                ))}
              </div>
              {userLists.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No public lists available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="anime" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userLists
                  .filter(item => item.media_type === 'anime')
                  .map((item) => (
                    <div key={item.id} className="space-y-2">
                      <AnimeCard
                        anime={{
                          id: item.title?.id || '',
                          title: item.title?.title || '',
                          image_url: item.title?.image_url || '',
                          score: item.title?.score || 0,
                          year: item.title?.year,
                          synopsis: item.title?.synopsis || '',
                          episodes: item.anime_details?.episodes,
                          status: item.anime_details?.status,
                          type: 'TV',
                          genres: []
                        }}
                      />
                      <div className="text-sm text-muted-foreground">
                        Status: {item.status?.label || 'Unknown'}
                        {item.score && ` • Score: ${item.score}/10`}
                        {item.episodes_watched && ` • Progress: ${item.episodes_watched}/${item.anime_details?.episodes || '?'}`}
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="manga" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userLists
                  .filter(item => item.media_type === 'manga')
                  .map((item) => (
                    <div key={item.id} className="space-y-2">
                      <AnimeCard
                        anime={{
                          id: item.title?.id || '',
                          title: item.title?.title || '',
                          image_url: item.title?.image_url || '',
                          score: item.title?.score || 0,
                          year: item.title?.year,
                          synopsis: item.title?.synopsis || '',
                          type: 'Manga',
                          genres: [],
                          status: item.manga_details?.status
                        }}
                      />
                      <div className="text-sm text-muted-foreground">
                        Status: {item.status?.label || 'Unknown'}
                        {item.score && ` • Score: ${item.score}/10`}
                        {item.chapters_read && ` • Progress: ${item.chapters_read}/${item.manga_details?.chapters || '?'}`}
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}