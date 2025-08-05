import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { Navigation } from '@/components/Navigation';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { ListManager } from '@/components/features/ListManager';
import { ListStatistics } from '@/components/features/ListStatistics';
import { SyncStatus } from '@/components/SyncStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  BookOpen, 
  BarChart3, 
  Heart, 
  Sparkles,
  Mail,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useUserTitleLists } from '@/hooks/useUserTitleLists';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff } from 'lucide-react';

const MyLists = () => {
  const { user } = useAuth();
  const { canUseFeature } = useEmailVerification();
  const { titleLists, listStatuses, isLoading, isDataFromCache, isOnline } = useUserTitleLists();
  const [activeTab, setActiveTab] = useState<'anime' | 'manga'>('anime');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showStats, setShowStats] = useState(false);

  // Filter counts
  const animeCount = titleLists.filter(item => item.media_type === 'anime').length;
  const mangaCount = titleLists.filter(item => item.media_type === 'manga').length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 text-center max-w-md mx-4">
            <CardContent className="space-y-4">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">Sign In Required</h2>
              <p className="text-muted-foreground">
                Please sign in to manage your anime and manga lists.
              </p>
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!canUseFeature('my_lists')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md mx-4 glass-card border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-10" />
            <CardContent className="relative p-8 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 glass-card border-primary/20 rounded-full flex items-center justify-center">
                    <Heart className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-accent-foreground animate-bounce" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-gradient-primary">Unlock Your Lists!</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Verify your email to save your progress and access your personalized anime & manga collection.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      className="w-full glass-button gradient-primary hover:glow-primary transition-all duration-300 transform hover:scale-105"
                      onClick={() => window.location.href = '/'}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Verify Email & Continue
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full hover:bg-muted/20"
                      onClick={() => window.location.href = '/'}
                    >
                      Return Home
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      <EmailVerificationBanner />
      
      {/* Header with animated background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-accent text-primary-foreground pt-24 pb-12">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat bg-center" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                My Lists
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
                Manage your anime and manga collections with advanced tracking and statistics.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Sync Status */}
        <div className="mb-6">
          <SyncStatus />
        </div>

        {/* Offline/Cache Status Indicator */}
        {(isDataFromCache || !isOnline) && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Wifi className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                {!isOnline 
                  ? "Offline Mode: Displaying cached data from your last sync"
                  : "Displaying cached data - some information may not be the most recent"
                }
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Control Panel */}
        <Card className="mb-8 border-border/30 bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-lg shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  List Management
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {animeCount} Anime
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {mangaCount} Manga
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={showStats ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                </Button>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="z-dropdown">
                    <SelectItem value="">All Statuses</SelectItem>
                    {listStatuses
                      .filter(status => status.media_type === activeTab || status.media_type === 'both')
                      .map(status => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.label}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Panel */}
        {showStats && (
          <div className="mb-8">
            <ListStatistics contentType="both" />
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'anime' | 'manga')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="anime" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Anime ({animeCount})
            </TabsTrigger>
            <TabsTrigger value="manga" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Manga ({mangaCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anime" className="space-y-6">
            <ListManager 
              contentType="anime" 
              statusFilter={statusFilter}
            />
          </TabsContent>

          <TabsContent value="manga" className="space-y-6">
            <ListManager 
              contentType="manga" 
              statusFilter={statusFilter}
            />
          </TabsContent>
        </Tabs>

        {/* Empty State - only show if no lists at all */}
        {titleLists.length === 0 && !isLoading && (
          <Card className="text-center p-12">
            <CardContent className="space-y-4">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">Your Lists Are Empty</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start building your collection by exploring anime and manga, then add them to your lists to track your progress.
              </p>
              <div className="flex justify-center gap-4 mt-6">
                <Button onClick={() => window.location.href = '/anime'}>
                  <Play className="w-4 h-4 mr-2" />
                  Explore Anime
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/manga'}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Explore Manga
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyLists;