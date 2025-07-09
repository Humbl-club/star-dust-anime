import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { useSimpleGameification } from "@/hooks/useSimpleGameification";
import { User, Sparkles, BookOpen, Heart, TrendingUp, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
        {/* Welcome Header with Enhanced Username Display */}
        <div className="text-center space-y-6">
          <div className="relative max-w-4xl mx-auto">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-secondary rounded-3xl blur-2xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative glass-card border border-primary/30 p-8 md:p-12 rounded-3xl shadow-glow-primary">
              <div className="flex flex-col items-center gap-6">
                {/* Animated crown icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-40 animate-pulse" />
                  <div className="relative p-4 bg-gradient-primary rounded-full shadow-glow-primary">
                    <Crown className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>
                
                {/* Welcome text with username */}
                <div className="text-center space-y-3">
                  <h1 className="text-4xl md:text-5xl font-bold">
                    <span className="text-muted-foreground">Welcome back,</span>
                    <br />
                    <span className={cn(
                      "inline-block mt-2",
                      `username-${stats?.usernameTier?.toLowerCase() || 'common'}`
                    )}>
                      {stats?.currentUsername || 'User'}
                    </span>
                  </h1>
                  
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl animate-bounce">{getTierEmoji(stats?.usernameTier)}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "px-4 py-2 text-sm font-semibold",
                        getTierColor(stats?.usernameTier)
                      )}
                    >
                      {stats?.usernameTier || 'COMMON'} TIER
                    </Badge>
                  </div>
                </div>
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                  Your personalized anime and manga hub awaits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats with Enhanced Glass Design */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Profile Overview */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative glass-card border border-primary/20 p-6 rounded-2xl hover:glow-card-hover transition-all duration-300 spring-bounce">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-bold text-foreground">Profile</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-semibold text-foreground truncate text-sm">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Lists Count */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative glass-card border border-primary/20 p-6 rounded-2xl hover:glow-card-hover transition-all duration-300 spring-bounce">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                  <BookOpen className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-bold text-foreground">My Lists</h3>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gradient-primary">-</p>
                <p className="text-sm text-muted-foreground">Titles tracked</p>
              </div>
            </div>
          </div>

          {/* Favorites */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative glass-card border border-primary/20 p-6 rounded-2xl hover:glow-card-hover transition-all duration-300 spring-bounce">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <Heart className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-bold text-foreground">Favorites</h3>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gradient-primary">-</p>
                <p className="text-sm text-muted-foreground">Loved series</p>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative glass-card border border-primary/20 p-6 rounded-2xl hover:glow-card-hover transition-all duration-300 spring-bounce">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-bold text-foreground">Activity</h3>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gradient-primary">-</p>
                <p className="text-sm text-muted-foreground">Recent updates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions with Enhanced Glass Design */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-10" />
          <div className="relative glass-card border border-primary/30 p-8 md:p-10 rounded-3xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gradient-primary mb-3">Explore Your World</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover new anime and manga, or manage your personal collection
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <a 
                href="/anime" 
                className="relative group spring-bounce"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="relative glass-card border border-primary/20 p-8 rounded-2xl hover:glow-card-hover transition-all duration-300 text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto group-hover:shadow-glow-primary transition-all duration-300">
                      <BookOpen className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-lg">Browse Anime</h3>
                  <p className="text-muted-foreground">Discover new series</p>
                </div>
              </a>
              
              <a 
                href="/manga" 
                className="relative group spring-bounce"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="relative glass-card border border-primary/20 p-8 rounded-2xl hover:glow-card-hover transition-all duration-300 text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mx-auto group-hover:shadow-glow-accent transition-all duration-300">
                      <Star className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-lg">Browse Manga</h3>
                  <p className="text-muted-foreground">Find great reads</p>
                </div>
              </a>
              
              <a 
                href="/my-lists" 
                className="relative group spring-bounce"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="relative glass-card border border-primary/20 p-8 rounded-2xl hover:glow-card-hover transition-all duration-300 text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto group-hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all duration-300">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-lg">My Lists</h3>
                  <p className="text-muted-foreground">Manage collection</p>
                </div>
              </a>
              
              <a 
                href="/recommendations" 
                className="relative group spring-bounce"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="relative glass-card border border-primary/20 p-8 rounded-2xl hover:glow-card-hover transition-all duration-300 text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-orange-500 rounded-2xl flex items-center justify-center mx-auto group-hover:shadow-glow-accent transition-all duration-300">
                      <TrendingUp className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-lg">Recommendations</h3>
                  <p className="text-muted-foreground">Get suggestions</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;