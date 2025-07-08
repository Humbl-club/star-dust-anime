import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useGameification } from '@/hooks/useGameification';
import { useUserLists } from '@/hooks/useUserLists';
import { 
  Trophy, 
  Star, 
  Crown, 
  Target, 
  Zap, 
  Heart,
  CheckCircle2,
  Gift,
  Users,
  TrendingUp,
  Sparkles,
  Play,
  BookOpen
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  points: number;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  isClaimable: boolean;
}

const achievementTiers = {
  BRONZE: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  SILVER: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  GOLD: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  PLATINUM: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' }
};

export const AchievementSystem = () => {
  const { stats, awardPoints } = useGameification();
  const { animeList, mangaList } = useUserLists();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Calculate achievements based on user data
  useEffect(() => {
    if (!stats) return;

    const animeCompleted = animeList.filter(item => item.status === 'completed').length;
    const mangaCompleted = mangaList.filter(item => item.status === 'completed').length;
    const totalWatched = animeList.reduce((sum, item) => sum + (item.episodes_watched || 0), 0);
    const totalPoints = stats.totalPoints;
    const loginStreak = stats.loginStreak;

    const calculatedAchievements: Achievement[] = [
      // Anime Achievements
      {
        id: 'anime_starter',
        title: 'Anime Explorer',
        description: 'Complete your first anime',
        icon: Play,
        tier: 'BRONZE',
        points: 50,
        progress: Math.min(animeCompleted, 1),
        maxProgress: 1,
        isCompleted: animeCompleted >= 1,
        isClaimable: animeCompleted >= 1
      },
      {
        id: 'anime_enthusiast',
        title: 'Anime Enthusiast',
        description: 'Complete 10 anime series',
        icon: Star,
        tier: 'SILVER',
        points: 150,
        progress: Math.min(animeCompleted, 10),
        maxProgress: 10,
        isCompleted: animeCompleted >= 10,
        isClaimable: animeCompleted >= 10
      },
      {
        id: 'anime_master',
        title: 'Anime Master',
        description: 'Complete 50 anime series',
        icon: Crown,
        tier: 'GOLD',
        points: 500,
        progress: Math.min(animeCompleted, 50),
        maxProgress: 50,
        isCompleted: animeCompleted >= 50,
        isClaimable: animeCompleted >= 50
      },

      // Manga Achievements
      {
        id: 'manga_reader',
        title: 'Manga Reader',
        description: 'Complete your first manga',
        icon: BookOpen,
        tier: 'BRONZE',
        points: 50,
        progress: Math.min(mangaCompleted, 1),
        maxProgress: 1,
        isCompleted: mangaCompleted >= 1,
        isClaimable: mangaCompleted >= 1
      },

      // Episode Achievements
      {
        id: 'episode_hunter',
        title: 'Episode Hunter',
        description: 'Watch 100 episodes',
        icon: Target,
        tier: 'SILVER',
        points: 200,
        progress: Math.min(totalWatched, 100),
        maxProgress: 100,
        isCompleted: totalWatched >= 100,
        isClaimable: totalWatched >= 100
      },
      {
        id: 'binge_master',
        title: 'Binge Master',
        description: 'Watch 500 episodes',
        icon: TrendingUp,
        tier: 'GOLD',
        points: 750,
        progress: Math.min(totalWatched, 500),
        maxProgress: 500,
        isCompleted: totalWatched >= 500,
        isClaimable: totalWatched >= 500
      },

      // Points Achievements
      {
        id: 'point_collector',
        title: 'Point Collector',
        description: 'Earn 500 total points',
        icon: Zap,
        tier: 'BRONZE',
        points: 100,
        progress: Math.min(totalPoints, 500),
        maxProgress: 500,
        isCompleted: totalPoints >= 500,
        isClaimable: totalPoints >= 500
      },
      {
        id: 'point_master',
        title: 'Point Master',
        description: 'Earn 2000 total points',
        icon: Sparkles,
        tier: 'GOLD',
        points: 300,
        progress: Math.min(totalPoints, 2000),
        maxProgress: 2000,
        isCompleted: totalPoints >= 2000,
        isClaimable: totalPoints >= 2000
      },

      // Login Achievements
      {
        id: 'loyal_fan',
        title: 'Loyal Fan',
        description: 'Login 7 days in a row',
        icon: Heart,
        tier: 'SILVER',
        points: 200,
        progress: Math.min(loginStreak, 7),
        maxProgress: 7,
        isCompleted: loginStreak >= 7,
        isClaimable: loginStreak >= 7
      },
      {
        id: 'dedicated_otaku',
        title: 'Dedicated Otaku',
        description: 'Login 30 days in a row',
        icon: Trophy,
        tier: 'PLATINUM',
        points: 1000,
        progress: Math.min(loginStreak, 30),
        maxProgress: 30,
        isCompleted: loginStreak >= 30,
        isClaimable: loginStreak >= 30
      }
    ];

    setAchievements(calculatedAchievements);
  }, [stats, animeList, mangaList]);

  const handleClaimAchievement = async (achievement: Achievement) => {
    const success = await awardPoints('achievement', achievement.points, {
      achievementId: achievement.id,
      achievementTitle: achievement.title
    });

    if (success) {
      // Mark as claimed (in a real app, you'd persist this)
      setAchievements(prev => 
        prev.map(a => 
          a.id === achievement.id 
            ? { ...a, isClaimable: false }
            : a
        )
      );
    }
  };

  const completedCount = achievements.filter(a => a.isCompleted).length;
  const claimableCount = achievements.filter(a => a.isClaimable).length;

  return (
    <div className="space-y-6">
      {/* Achievement Overview */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements
            {claimableCount > 0 && (
              <Badge variant="default" className="ml-2">
                {claimableCount} ready to claim!
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{completedCount}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{achievements.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{claimableCount}</div>
              <div className="text-sm text-muted-foreground">Claimable</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {Math.round((completedCount / achievements.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement List */}
      <div className="grid gap-4">
        {achievements.map((achievement) => {
          const tierStyle = achievementTiers[achievement.tier];
          const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;

          return (
            <Card 
              key={achievement.id} 
              className={`border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 ${
                achievement.isCompleted ? `${tierStyle.bg} ${tierStyle.border}` : ''
              } ${achievement.isClaimable ? 'ring-2 ring-primary/50' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-background/50 flex items-center justify-center ${
                      achievement.isCompleted ? tierStyle.bg : ''
                    }`}>
                      <achievement.icon className={`w-6 h-6 ${
                        achievement.isCompleted ? tierStyle.color : 'text-muted-foreground'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${tierStyle.color} ${tierStyle.border}`}
                        >
                          {achievement.tier}
                        </Badge>
                        {achievement.isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>{achievement.progress} / {achievement.maxProgress}</span>
                          <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      +{achievement.points}
                    </Badge>
                    
                    {achievement.isClaimable ? (
                      <Button 
                        size="sm"
                        onClick={() => handleClaimAchievement(achievement)}
                        className="flex items-center gap-1"
                      >
                        <Gift className="w-4 h-4" />
                        Claim
                      </Button>
                    ) : achievement.isCompleted ? (
                      <Badge variant="secondary">Claimed</Badge>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};