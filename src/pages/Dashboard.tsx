import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { useSimpleGameification } from "@/hooks/useSimpleGameification";
import { Crown, User } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { stats, loading } = useSimpleGameification();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gradient-primary">
            Welcome to your Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your anime journey and manage your profile
          </p>
        </div>

        {/* User Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Username Card */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Your Username
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-primary">
                  {stats?.currentUsername || 'Loading...'}
                </div>
                <Badge variant="outline" className="text-sm">
                  {stats?.usernameTier || 'COMMON'} Tier
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Login Streak */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-500" />
                Login Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats?.loginStreak || 0} days
              </div>
              <p className="text-sm text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>

          {/* Profile Info */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Explore the platform and manage your anime lists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a 
                href="/anime" 
                className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-center"
              >
                <h3 className="font-semibold">Browse Anime</h3>
                <p className="text-sm text-muted-foreground">Discover new series</p>
              </a>
              <a 
                href="/manga" 
                className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-center"
              >
                <h3 className="font-semibold">Browse Manga</h3>
                <p className="text-sm text-muted-foreground">Find great reads</p>
              </a>
              <a 
                href="/my-lists" 
                className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-center"
              >
                <h3 className="font-semibold">My Lists</h3>
                <p className="text-sm text-muted-foreground">Manage your lists</p>
              </a>
              <a 
                href="/recommendations" 
                className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-center"
              >
                <h3 className="font-semibold">Recommendations</h3>
                <p className="text-sm text-muted-foreground">Get suggestions</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;