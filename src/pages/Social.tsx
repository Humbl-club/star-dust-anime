import { useState, useEffect } from "react";
import { useSocial } from "@/hooks/useSocial";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { 
  Search,
  Users, 
  UserPlus,
  UserMinus,
  Activity,
  Star,
  Play,
  BookOpen,
  Heart,
  MessageCircle,
  Calendar,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Social = () => {
  const { user } = useAuth();
  const { 
    loading,
    followers,
    following,
    activityFeed,
    followUser,
    unfollowUser,
    isFollowing,
    searchUsers
  } = useSocial();
  
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'added_to_list': return <UserPlus className="w-4 h-4" />;
      case 'completed': return <Star className="w-4 h-4" />;
      case 'rated': return <Heart className="w-4 h-4" />;
      case 'reviewed': return <MessageCircle className="w-4 h-4" />;
      case 'started_watching': return <Play className="w-4 h-4" />;
      case 'started_reading': return <BookOpen className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityText = (activity: any) => {
    const { activity_type, user, metadata } = activity;
    const userName = user?.full_name || user?.username || 'Someone';
    
    switch (activity_type) {
      case 'added_to_list':
        return `${userName} added ${metadata?.content_title || 'a title'} to their list`;
      case 'completed':
        return `${userName} completed ${metadata?.content_title || 'a title'}`;
      case 'rated':
        return `${userName} rated ${metadata?.content_title || 'a title'} ${metadata?.score || '?'}/10`;
      case 'reviewed':
        return `${userName} wrote a review for ${metadata?.content_title || 'a title'}`;
      case 'started_watching':
        return `${userName} started watching ${metadata?.content_title || 'a title'}`;
      case 'started_reading':
        return `${userName} started reading ${metadata?.content_title || 'a title'}`;
      default:
        return `${userName} had some activity`;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
            <p className="text-muted-foreground">You need to be signed in to access social features.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="w-8 h-8" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Social Hub
              </h1>
            </div>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Connect with fellow anime and manga enthusiasts. Share your journey and discover new content.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary mb-1">{following.length}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </CardContent>
          </Card>

          <Card className="text-center border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-secondary mb-1">{followers.length}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </CardContent>
          </Card>

          <Card className="text-center border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-accent mb-1">{activityFeed.length}</div>
              <div className="text-sm text-muted-foreground">Activities</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
            <TabsTrigger value="feed">
              <Activity className="w-4 h-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="following">
              <Users className="w-4 h-4 mr-2" />
              Following
            </TabsTrigger>
            <TabsTrigger value="followers">
              <UserPlus className="w-4 h-4 mr-2" />
              Followers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityFeed.length > 0 ? (
                  <div className="space-y-4">
                    {activityFeed.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={activity.user?.avatar_url} />
                          <AvatarFallback>
                            {activity.user?.full_name?.charAt(0) || activity.user?.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getActivityIcon(activity.activity_type)}
                            <span className="text-sm">{getActivityText(activity)}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.created_at))} ago
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                    <p className="text-muted-foreground">
                      Follow some users to see their activity in your feed.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Find Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by username or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={searchLoading}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={result.avatar_url} />
                            <AvatarFallback>
                              {result.full_name?.charAt(0) || result.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{result.full_name || result.username}</div>
                            {result.username && result.full_name && (
                              <div className="text-sm text-muted-foreground">@{result.username}</div>
                            )}
                          </div>
                        </div>
                        
                        {result.id !== user.id && (
                          <Button
                            size="sm"
                            variant={isFollowing(result.id) ? "outline" : "default"}
                            onClick={() => isFollowing(result.id) ? unfollowUser(result.id) : followUser(result.id)}
                          >
                            {isFollowing(result.id) ? (
                              <>
                                <UserMinus className="w-4 h-4 mr-2" />
                                Unfollow
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="following">
            <UsersList users={following} title="Following" type="following" />
          </TabsContent>

          <TabsContent value="followers">
            <UsersList users={followers} title="Followers" type="followers" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface UsersListProps {
  users: any[];
  title: string;
  type: 'following' | 'followers';
}

const UsersList = ({ users, title, type }: UsersListProps) => {
  const { unfollowUser, followUser, isFollowing } = useSocial();

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{title} ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length > 0 ? (
          <div className="space-y-3">
            {users.map((user) => {
              const profile = type === 'following' ? user.profiles : user.profiles;
              return (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{profile?.full_name || profile?.username}</div>
                      {profile?.username && profile?.full_name && (
                        <div className="text-sm text-muted-foreground">@{profile.username}</div>
                      )}
                    </div>
                  </div>
                  
                  {type === 'following' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unfollowUser(user.following_id)}
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfollow
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No {title.toLowerCase()} yet</h3>
            <p className="text-muted-foreground">
              {type === 'following' 
                ? "Search for users to follow and see their activity." 
                : "Share your profile to gain followers."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Social;