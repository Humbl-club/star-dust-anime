import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserLists } from "@/hooks/useUserLists";
import { useGameification } from "@/hooks/useGameification";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Play, 
  BookOpen, 
  Trophy, 
  Target,
  TrendingUp,
  Calendar,
  Star,
  Clock,
  Check,
  Pause,
  X,
  Crown,
  Zap,
  Gift,
  Users
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { WelcomeModal } from "@/components/WelcomeModal";
import { AchievementSystem } from "@/components/AchievementSystem";
import { PointActivity } from "@/components/PointActivity";

const Dashboard = () => {
  const { user } = useAuth();
  const { animeList, mangaList, loading } = useUserLists();
  const { stats, lootBoxes, loading: gameLoading, openLootBox } = useGameification();
  const { isFirstTime, loading: firstTimeLoading, markAsReturningUser } = useFirstTimeUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Show welcome modal for first-time users
  useEffect(() => {
    if (!firstTimeLoading && isFirstTime && stats) {
      setShowWelcomeModal(true);
    }
  }, [isFirstTime, firstTimeLoading, stats]);

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
    markAsReturningUser();
  };

  const handleOpenLootBox = async () => {
    if (lootBoxes && lootBoxes.length > 0) {
      await openLootBox('standard');
    }
  };

  // Calculate anime statistics
  const animeStats = {
    total: animeList.length,
    watching: animeList.filter(item => item.status === 'watching').length,
    completed: animeList.filter(item => item.status === 'completed').length,
    on_hold: animeList.filter(item => item.status === 'on_hold').length,
    dropped: animeList.filter(item => item.status === 'dropped').length,
    plan_to_watch: animeList.filter(item => item.status === 'plan_to_watch').length,
    totalEpisodes: animeList.reduce((sum, item) => sum + (item.episodes_watched || 0), 0),
    averageScore: animeList.filter(item => item.score).length > 0 
      ? animeList.filter(item => item.score).reduce((sum, item) => sum + (item.score || 0), 0) / animeList.filter(item => item.score).length
      : 0
  };

  // Calculate manga statistics  
  const mangaStats = {
    total: mangaList.length,
    reading: mangaList.filter(item => item.status === 'reading').length,
    completed: mangaList.filter(item => item.status === 'completed').length,
    on_hold: mangaList.filter(item => item.status === 'on_hold').length,
    dropped: mangaList.filter(item => item.status === 'dropped').length,
    plan_to_read: mangaList.filter(item => item.status === 'plan_to_read').length,
    totalChapters: mangaList.reduce((sum, item) => sum + (item.chapters_read || 0), 0),
    averageScore: mangaList.filter(item => item.score).length > 0
      ? mangaList.filter(item => item.score).reduce((sum, item) => sum + (item.score || 0), 0) / mangaList.filter(item => item.score).length
      : 0
  };

  // Data for charts
  const animeChartData = [
    { name: 'Watching', value: animeStats.watching, color: '#10b981' },
    { name: 'Completed', value: animeStats.completed, color: '#3b82f6' },
    { name: 'On Hold', value: animeStats.on_hold, color: '#f59e0b' },
    { name: 'Dropped', value: animeStats.dropped, color: '#ef4444' },
    { name: 'Plan to Watch', value: animeStats.plan_to_watch, color: '#6b7280' }
  ].filter(item => item.value > 0);

  const mangaChartData = [
    { name: 'Reading', value: mangaStats.reading, color: '#10b981' },
    { name: 'Completed', value: mangaStats.completed, color: '#3b82f6' },
    { name: 'On Hold', value: mangaStats.on_hold, color: '#f59e0b' },
    { name: 'Dropped', value: mangaStats.dropped, color: '#ef4444' },
    { name: 'Plan to Read', value: mangaStats.plan_to_read, color: '#6b7280' }
  ].filter(item => item.value > 0);

  // No auth check needed - ProtectedRoute handles this

  if (loading || gameLoading || firstTimeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      {/* Gamified Header */}
      <div className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Welcome, {stats?.currentUsername}!
              </h1>
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {stats?.usernameTier} Tier
              </Badge>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span className="text-xl font-bold">{stats?.totalPoints} Points</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span>Streak: {stats?.loginStreak} days</span>
              </div>
            </div>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Track your anime journey and collect legendary usernames!
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Auto-sync status message - show if no data available */}
        {animeStats.total === 0 && mangaStats.total === 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6 border border-primary/20">
              <h3 className="text-lg font-semibold mb-2">Database Auto-Initialization Active</h3>
              <p className="text-muted-foreground mb-4">
                Our system is automatically building your comprehensive anime and manga database in the background. 
                This includes trending titles, schedules, and metadata from AniList and MyAnimeList.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                <span className="text-sm text-primary ml-2">Processing in background...</span>
              </div>
            </div>
          </div>
        )}

        {/* Gamification Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="text-center border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{animeStats.total}</div>
              <div className="text-sm text-muted-foreground">Anime Entries</div>
            </CardContent>
          </Card>

          <Card className="text-center border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="w-8 h-8 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-secondary mb-1">{mangaStats.total}</div>
              <div className="text-sm text-muted-foreground">Manga Entries</div>
            </CardContent>
          </Card>

          <Card className="text-center border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {animeStats.completed + mangaStats.completed}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>

          <Card className="text-center border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {animeStats.totalEpisodes}
              </div>
              <div className="text-sm text-muted-foreground">Episodes Watched</div>
            </CardContent>
          </Card>

          <Card className="text-center border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{stats?.totalPoints || 0}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </CardContent>
          </Card>

          <Card className="text-center border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <Gift className="w-8 h-8 text-accent" />
              </div>
              <div className="text-2xl font-bold text-accent mb-1">
                {lootBoxes?.reduce((sum, box) => sum + box.quantity, 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Loot Boxes</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {lootBoxes && lootBoxes.length > 0 && (
          <Card className="mb-8 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Quick Actions
              </h3>
              <div className="flex gap-4">
                <Button 
                  variant="default" 
                  className="flex items-center gap-2"
                  onClick={handleOpenLootBox}
                  disabled={!lootBoxes || lootBoxes.reduce((sum, box) => sum + box.quantity, 0) === 0}
                >
                  <Gift className="w-4 h-4" />
                  Open Loot Box ({lootBoxes?.reduce((sum, box) => sum + box.quantity, 0) || 0})
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Trade Usernames
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="anime">Anime</TabsTrigger>
            <TabsTrigger value="manga">Manga</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Point Activities */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Daily Activities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PointActivity
                    type="rate"
                    points={10}
                    label="Rate an anime"
                    description="Give a score to any anime"
                    variant="card"
                  />
                  <PointActivity
                    type="add_to_list"
                    points={5}
                    label="Add to your list"
                    description="Add anime or manga to your collection"
                    variant="card"
                  />
                  <PointActivity
                    type="complete"
                    points={20}
                    label="Complete a series"
                    description="Finish watching an anime or reading manga"
                    variant="card"
                  />
                  <PointActivity
                    type="review"
                    points={25}
                    label="Write a review"
                    description="Share your thoughts on a series"
                    variant="card"
                  />
                </CardContent>
              </Card>

              {/* Today's Stats */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today's Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Daily Points</span>
                        <span className="text-sm text-muted-foreground">{stats?.dailyPoints || 0}/100</span>
                      </div>
                      <Progress value={((stats?.dailyPoints || 0) / 100) * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Login Streak</span>
                        <span className="text-sm text-muted-foreground">{stats?.loginStreak || 0} days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 7 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full ${
                              i < (stats?.loginStreak || 0) ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Quick Goals</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Daily login completed</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-4 h-4 border-2 border-muted rounded-sm" />
                          <span>Rate 3 anime series</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-4 h-4 border-2 border-muted rounded-sm" />
                          <span>Add 5 items to your list</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementSystem />
          </TabsContent>

          <TabsContent value="anime">
            <div className="space-y-6">
              {/* Anime Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Star className="w-8 h-8 text-yellow-400" />
                      <div>
                        <div className="text-2xl font-bold">
                          {animeStats.averageScore > 0 ? animeStats.averageScore.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Average Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Play className="w-8 h-8 text-green-400" />
                      <div>
                        <div className="text-2xl font-bold">{animeStats.watching}</div>
                        <div className="text-sm text-muted-foreground">Currently Watching</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-gray-400" />
                      <div>
                        <div className="text-2xl font-bold">{animeStats.plan_to_watch}</div>
                        <div className="text-sm text-muted-foreground">Plan to Watch</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manga">
            <div className="space-y-6">
              {/* Manga Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Star className="w-8 h-8 text-yellow-400" />
                      <div>
                        <div className="text-2xl font-bold">
                          {mangaStats.averageScore > 0 ? mangaStats.averageScore.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Average Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-8 h-8 text-green-400" />
                      <div>
                        <div className="text-2xl font-bold">{mangaStats.reading}</div>
                        <div className="text-sm text-muted-foreground">Currently Reading</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Target className="w-8 h-8 text-blue-400" />
                      <div>
                        <div className="text-2xl font-bold">{mangaStats.totalChapters}</div>
                        <div className="text-sm text-muted-foreground">Chapters Read</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Welcome Modal for First-Time Users */}
      <WelcomeModal 
        open={showWelcomeModal} 
        onClose={handleWelcomeClose}
      />
    </div>
  );
};

export default Dashboard;