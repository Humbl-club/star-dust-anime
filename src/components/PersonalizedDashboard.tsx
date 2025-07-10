import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useSmartRecommendations } from '@/hooks/useSmartRecommendations';
import { useUserLists } from '@/hooks/useUserLists';
import { useAuth } from '@/hooks/useAuth';
import { AnimeCard } from './AnimeCard';
import { Sparkles, TrendingUp, Target, BookOpen, Tv, BarChart3, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PersonalizedDashboard() {
  const { user } = useAuth();
  const { recommendations, userProfile, loading, refreshRecommendations } = useSmartRecommendations();
  const { animeList, mangaList } = useUserLists();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Personalized Dashboard</h3>
          <p className="text-muted-foreground text-center">
            Sign in to get AI-powered recommendations based on your viewing history
          </p>
        </CardContent>
      </Card>
    );
  }

  const animeStats = {
    total: animeList?.length || 0,
    completed: animeList?.filter(item => item.status === 'completed').length || 0,
    watching: animeList?.filter(item => item.status === 'watching').length || 0,
    planToWatch: animeList?.filter(item => item.status === 'plan_to_watch').length || 0
  };

  const mangaStats = {
    total: mangaList?.length || 0,
    completed: mangaList?.filter(item => item.status === 'completed').length || 0,
    reading: mangaList?.filter(item => item.status === 'reading').length || 0,
    planToRead: mangaList?.filter(item => item.status === 'plan_to_read').length || 0
  };

  const totalContent = animeStats.total + mangaStats.total;
  const completedContent = animeStats.completed + mangaStats.completed;
  const completionRate = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Your Personal Dashboard
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights and recommendations just for you
          </p>
        </div>
        <Button
          onClick={refreshRecommendations}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Sparkles className="w-4 h-4" />
            For You
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <Target className="w-4 h-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Anime</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{animeStats.total}</div>
                  <div className="text-xs text-muted-foreground">
                    {animeStats.completed} completed
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Manga</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{mangaStats.total}</div>
                  <div className="text-xs text-muted-foreground">
                    {mangaStats.completed} completed
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Completion</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
                  <div className="text-xs text-muted-foreground">
                    {completedContent} of {totalContent}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Score</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">
                    {userProfile?.averageScore ? userProfile.averageScore.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">Average rating</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Completion Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Completion Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(completionRate)}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
              
              {animeStats.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Anime Completion</span>
                    <span>{Math.round((animeStats.completed / animeStats.total) * 100)}%</span>
                  </div>
                  <Progress value={(animeStats.completed / animeStats.total) * 100} className="h-2" />
                </div>
              )}
              
              {mangaStats.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Manga Completion</span>
                    <span>{Math.round((mangaStats.completed / mangaStats.total) * 100)}%</span>
                  </div>
                  <Progress value={(mangaStats.completed / mangaStats.total) * 100} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Recommendations
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Personalized suggestions based on your viewing history and preferences
              </p>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-muted rounded-lg aspect-[3/4] mb-2" />
                        <div className="bg-muted rounded h-4 mb-1" />
                        <div className="bg-muted rounded h-3 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {recommendations.map((rec, index) => (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                      >
                        <div className="relative">
                          <AnimeCard
                            anime={{
                              id: rec.id,
                              title: rec.title,
                              image_url: rec.image_url,
                              score: rec.score,
                              year: null,
                              type: rec.type,
                              status: 'Finished Airing',
                              synopsis: rec.synopsis,
                              genres: rec.genres
                            } as any}
                            onClick={() => window.location.href = `/${rec.type}/${rec.id}`}
                          />
                          <div className="absolute top-2 right-2">
                            <Badge 
                              variant="secondary" 
                              className="bg-primary/90 text-primary-foreground text-xs"
                            >
                              {rec.confidence}% match
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 px-1">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {rec.reason}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                    <p className="text-muted-foreground">
                      Add some anime or manga to your lists to get personalized recommendations
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-blue-500" />
                  Anime Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completed</span>
                  <Badge variant="secondary">{animeStats.completed}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Currently Watching</span>
                  <Badge variant="secondary">{animeStats.watching}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Plan to Watch</span>
                  <Badge variant="secondary">{animeStats.planToWatch}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  Manga Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completed</span>
                  <Badge variant="secondary">{mangaStats.completed}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Currently Reading</span>
                  <Badge variant="secondary">{mangaStats.reading}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Plan to Read</span>
                  <Badge variant="secondary">{mangaStats.planToRead}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Your Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userProfile?.favoriteGenres && userProfile.favoriteGenres.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Favorite Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.favoriteGenres.map((genre, index) => (
                        <Badge key={genre} variant={index < 3 ? "default" : "secondary"}>
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Content Preferences</h4>
                    <div className="flex gap-2">
                      {userProfile.preferredTypes.map(type => (
                        <Badge key={type} variant="outline">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Building your profile...</h3>
                  <p className="text-muted-foreground text-sm">
                    Rate some anime or manga to see your personalized insights
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}