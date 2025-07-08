import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSimpleGameification } from "@/hooks/useSimpleGameification";
import { useUserInitialization } from "@/hooks/useUserInitialization";
import { Navigation } from "@/components/Navigation";
import { FirstTimeLootBoxExperience } from "@/components/FirstTimeLootBoxExperience";
import { AchievementSystem } from "@/components/AchievementSystem";
import { LootBoxOpening } from "@/components/LootBoxOpening";
import { ActivityTracker } from "@/components/ActivityTracker";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Crown, 
  TrendingUp, 
  Award,
  Calendar,
  Package,
  Coins,
  User,
  Clock,
  Heart,
  Gift
} from "lucide-react";

const Dashboard = () => {
  const { 
    stats, 
    loading: gameLoading
  } = useSimpleGameification();
  
  const { initialization, isFirstTime } = useUserInitialization();
  const [activeTab, setActiveTab] = useState("overview");
  const [showFirstTimeExperience, setShowFirstTimeExperience] = useState(false);

  // Show first-time experience for new users
  useEffect(() => {
    if (!gameLoading && isFirstTime && stats) {
      setShowFirstTimeExperience(true);
    }
  }, [gameLoading, isFirstTime, stats]);

  const handleFirstTimeComplete = () => {
    setShowFirstTimeExperience(false);
  };

  const quickStats = [
    {
      title: "Total Points",
      value: stats?.totalPoints || 0,
      icon: Coins,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Daily Points",
      value: stats?.dailyPoints || 0,
      icon: Zap,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Login Streak",
      value: stats?.loginStreak || 0,
      icon: Heart,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    {
      title: "Username Tier",
      value: stats?.usernameTier || 'COMMON',
      icon: Crown,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gradient-primary">
              Welcome Back{stats?.currentUsername ? `, ${stats.currentUsername}` : ''}!
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track your anime journey, manage your collections, and unlock achievements.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="lootboxes" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Loot Boxes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Username Display */}
            {stats?.currentUsername && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Your Current Username
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg font-bold text-xl">
                      {stats.currentUsername}
                    </div>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {stats.usernameTier} TIER
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Tracking */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Earn Points</CardTitle>
                <CardDescription>Complete activities to earn points and unlock rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ActivityTracker
                    activityType="daily_login"
                    points={10}
                    metadata={{ source: 'dashboard' }}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="border rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Rate Anime
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Earn 5 points for each anime you rate
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        Add to Watchlist
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Earn 3 points for adding anime to your lists
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
                <CardDescription>See how you're doing across different activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Points Progress</span>
                      <span>{stats?.totalPoints || 0} / 1000</span>
                    </div>
                    <Progress value={((stats?.totalPoints || 0) / 1000) * 100} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Login Streak</span>
                      <span>{stats?.loginStreak || 0} days</span>
                    </div>
                    <Progress value={((stats?.loginStreak || 0) / 30) * 100} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementSystem />
          </TabsContent>

          <TabsContent value="lootboxes">
            <LootBoxOpening />
          </TabsContent>
        </Tabs>
      </div>

      {/* First Time Experience Modal */}
      <FirstTimeLootBoxExperience
        isOpen={showFirstTimeExperience}
        onComplete={handleFirstTimeComplete}
      />
    </div>
  );
};

export default Dashboard;