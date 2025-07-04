import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserLists } from "@/hooks/useUserLists";
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
  X
} from "lucide-react";
import { Navigation } from "@/components/Navigation";

const Dashboard = () => {
  const { user } = useAuth();
  const { animeList, mangaList, loading } = useUserLists();
  const [activeTab, setActiveTab] = useState("overview");

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
            <p className="text-muted-foreground">You need to be signed in to view your dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              My Dashboard
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Track your anime and manga journey. See your progress and statistics.
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

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="anime">Anime</TabsTrigger>
            <TabsTrigger value="manga">Manga</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Anime Distribution */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Anime Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {animeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={animeChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {animeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      No anime data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manga Distribution */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Manga Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mangaChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={mangaChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {mangaChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      No manga data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
    </div>
  );
};

export default Dashboard;