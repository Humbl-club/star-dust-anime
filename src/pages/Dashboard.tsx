import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { useSimpleGameification } from "@/hooks/useSimpleGameification";
import { User, Sparkles, BookOpen, Heart, TrendingUp } from "lucide-react";

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

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'GOD': return 'text-yellow-400 border-yellow-400/20';
      case 'LEGENDARY': return 'text-purple-400 border-purple-400/20';
      case 'EPIC': return 'text-pink-400 border-pink-400/20';
      case 'RARE': return 'text-blue-400 border-blue-400/20';
      case 'UNCOMMON': return 'text-green-400 border-green-400/20';
      default: return 'text-muted-foreground border-border/20';
    }
  };

  const getTierEmoji = (tier?: string) => {
    switch (tier) {
      case 'GOD': return '👑';
      case 'LEGENDARY': return '⭐';
      case 'EPIC': return '🔥';
      case 'RARE': return '💎';
      case 'UNCOMMON': return '✨';
      default: return '🌟';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Header with Username */}
        <div className="text-center space-y-6">
          <div className="glass-card border border-primary/20 glow-card p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-primary rounded-full glow-primary">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-gradient-primary">
                Welcome back, {stats?.currentUsername || 'User'}
              </h1>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">{getTierEmoji(stats?.usernameTier)}</span>
              <Badge 
                variant="outline" 
                className={`${getTierColor(stats?.usernameTier)} font-medium`}
              >
                {stats?.usernameTier || 'COMMON'} Profile
              </Badge>
            </div>
            
            <p className="text-muted-foreground">
              Your personalized anime and manga hub
            </p>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Profile Overview */}
          <div className="glass-card border border-primary/20 glow-card p-6 hover:glow-card-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground">Profile</h3>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium text-foreground truncate">{user?.email}</p>
            </div>
          </div>

          {/* Lists Count */}
          <div className="glass-card border border-primary/20 glow-card p-6 hover:glow-card-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground">My Lists</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gradient-primary">-</p>
              <p className="text-sm text-muted-foreground">Titles tracked</p>
            </div>
          </div>

          {/* Favorites */}
          <div className="glass-card border border-primary/20 glow-card p-6 hover:glow-card-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-foreground">Favorites</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gradient-primary">-</p>
              <p className="text-sm text-muted-foreground">Loved series</p>
            </div>
          </div>

          {/* Activity */}
          <div className="glass-card border border-primary/20 glow-card p-6 hover:glow-card-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="font-semibold text-foreground">Activity</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gradient-primary">-</p>
              <p className="text-sm text-muted-foreground">Recent updates</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card border border-primary/20 glow-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gradient-primary mb-2">Explore</h2>
            <p className="text-muted-foreground">
              Discover new anime and manga, or manage your collection
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a 
              href="/anime" 
              className="glass-card border border-accent/20 p-6 hover:glow-card-hover transition-all duration-300 text-center group"
            >
              <div className="mb-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto group-hover:glow-primary transition-all duration-300">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Browse Anime</h3>
              <p className="text-sm text-muted-foreground">Discover new series</p>
            </a>
            
            <a 
              href="/manga" 
              className="glass-card border border-accent/20 p-6 hover:glow-card-hover transition-all duration-300 text-center group"
            >
              <div className="mb-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto group-hover:glow-primary transition-all duration-300">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Browse Manga</h3>
              <p className="text-sm text-muted-foreground">Find great reads</p>
            </a>
            
            <a 
              href="/my-lists" 
              className="glass-card border border-accent/20 p-6 hover:glow-card-hover transition-all duration-300 text-center group"
            >
              <div className="mb-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto group-hover:glow-primary transition-all duration-300">
                  <Heart className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">My Lists</h3>
              <p className="text-sm text-muted-foreground">Manage collection</p>
            </a>
            
            <a 
              href="/recommendations" 
              className="glass-card border border-accent/20 p-6 hover:glow-card-hover transition-all duration-300 text-center group"
            >
              <div className="mb-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto group-hover:glow-primary transition-all duration-300">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Recommendations</h3>
              <p className="text-sm text-muted-foreground">Get suggestions</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;