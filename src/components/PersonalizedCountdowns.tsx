import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Clock, 
  User, 
  Settings, 
  Star,
  Heart,
  Play,
  BookOpen,
  Trash2,
  Plus
} from "lucide-react";
import { CountdownDisplay } from "./CountdownDisplay";
import { countdownService, CountdownData } from "@/services/countdownService";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserCountdownPreference {
  id: string;
  countdown_id: string;
  notifications_enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export const PersonalizedCountdowns = () => {
  const { user } = useAuth();
  const [userCountdowns, setUserCountdowns] = useState<CountdownData[]>([]);
  const [preferences, setPreferences] = useState<Map<string, UserCountdownPreference>>(new Map());
  const [globalNotifications, setGlobalNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load user's personalized countdowns
  useEffect(() => {
    if (user) {
      loadUserCountdowns();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserCountdowns = async () => {
    if (!user) return;

    try {
      // Get user's anime and manga lists to generate relevant countdowns
      const [animeListResponse, mangaListResponse] = await Promise.all([
        supabase
          .from('user_anime_lists')
          .select(`
            anime_id,
            status,
            anime:anime_id (
              id, title, title_english, next_episode_date, 
              next_episode_number, status, timezone
            )
          `)
          .eq('user_id', user.id)
          .in('status', ['watching', 'plan_to_watch']),
        
        supabase
          .from('user_manga_lists')
          .select(`
            manga_id,
            status,
            manga:manga_id (
              id, title, title_english, next_chapter_date,
              next_chapter_number, status, timezone
            )
          `)
          .eq('user_id', user.id)
          .in('status', ['reading', 'plan_to_read'])
      ]);

      const countdowns: CountdownData[] = [];

      // Generate anime countdowns
      if (animeListResponse.data) {
        animeListResponse.data.forEach(item => {
          if (item.anime) {
            const countdown = countdownService.createAnimeCountdown(item.anime);
            if (countdown && countdown.status !== 'finished') {
              countdowns.push(countdown);
            }
          }
        });
      }

      // Generate manga countdowns
      if (mangaListResponse.data) {
        mangaListResponse.data.forEach(item => {
          if (item.manga) {
            const countdown = countdownService.createMangaCountdown(item.manga);
            if (countdown && countdown.status !== 'finished') {
              countdowns.push(countdown);
            }
          }
        });
      }

      // Sort by release date
      countdowns.sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());

      setUserCountdowns(countdowns);
      setLoading(false);

    } catch (error) {
      console.error('Failed to load user countdowns:', error);
      toast.error('Failed to load your countdowns');
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (countdownId: string, enabled: boolean) => {
    if (!user) return;

    const newPreference: UserCountdownPreference = {
      id: `${user.id}-${countdownId}`,
      countdown_id: countdownId,
      notifications_enabled: enabled,
      priority: 'medium',
      created_at: new Date().toISOString()
    };

    // Update local state
    const newPreferences = new Map(preferences);
    newPreferences.set(countdownId, newPreference);
    setPreferences(newPreferences);

    // Show feedback
    toast.success(
      enabled ? 'Notifications enabled for this release' : 'Notifications disabled for this release'
    );

    // In a real app, you'd save this to the database
    localStorage.setItem(`countdown_pref_${countdownId}`, JSON.stringify(newPreference));
  };

  const removeCountdown = (countdownId: string) => {
    setUserCountdowns(prev => prev.filter(c => c.id !== countdownId));
    
    // Remove preference
    const newPreferences = new Map(preferences);
    newPreferences.delete(countdownId);
    setPreferences(newPreferences);
    
    localStorage.removeItem(`countdown_pref_${countdownId}`);
    toast.success('Countdown removed');
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityIcon = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return <Star className="w-3 h-3 fill-current" />;
      case 'medium': return <Heart className="w-3 h-3" />;
      case 'low': return <Clock className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  if (!user) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-8 text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
          <p className="text-muted-foreground">
            Sign in to see personalized countdowns for your anime and manga lists
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-8 text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading your personalized countdowns...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Your Countdowns
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span>Notifications</span>
              <Switch
                checked={globalNotifications}
                onCheckedChange={setGlobalNotifications}
              />
            </div>
            
            <Badge variant="secondary">
              {userCountdowns.length} items
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {userCountdowns.length > 0 ? (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {userCountdowns.filter(c => c.type === 'anime').length}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Play className="w-3 h-3" />
                  Anime
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {userCountdowns.filter(c => c.type === 'manga').length}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Manga
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {userCountdowns.filter(c => {
                    const timeRemaining = countdownService.calculateTimeRemaining(c.releaseDate);
                    return timeRemaining.isLive;
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Live Now</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {userCountdowns.filter(c => {
                    const timeRemaining = countdownService.calculateTimeRemaining(c.releaseDate);
                    return timeRemaining.totalSeconds <= 86400 && timeRemaining.totalSeconds > 0;
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
            </div>

            {/* Countdown List */}
            <div className="space-y-4">
              {userCountdowns.map((countdown, index) => (
                <div 
                  key={countdown.id}
                  className="relative group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CountdownDisplay 
                    countdown={countdown}
                    showNotifications={globalNotifications}
                    onNotificationToggle={(enabled) => handleNotificationToggle(countdown.id, enabled)}
                  />
                  
                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCountdown(countdown.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                    title="Remove countdown"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Active Countdowns</h3>
            <p className="text-muted-foreground mb-4">
              Add anime or manga to your lists to see personalized release countdowns
            </p>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Browse Anime & Manga
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};