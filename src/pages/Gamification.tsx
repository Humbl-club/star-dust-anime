import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { useSimpleGameification } from "@/hooks/useSimpleGameification";
import { Crown, Gift } from "lucide-react";

const Gamification = () => {
  const { stats, loading } = useSimpleGameification();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading gamification...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-primary mb-4">
            Your Profile
          </h1>
          <p className="text-muted-foreground text-lg">
            Your unique username and profile information
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Username Display */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                Your Username
              </CardTitle>
              <CardDescription>
                Your unique anime username assigned when you joined
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-gradient-primary">
                  {stats?.currentUsername || 'Loading...'}
                </div>
                <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-primary-glow/20 border border-primary/30">
                  <span className="text-primary font-semibold">
                    {stats?.usernameTier || 'COMMON'} Tier
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login Stats */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-green-500" />
                Login Stats
              </CardTitle>
              <CardDescription>
                Keep logging in to maintain your streak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {stats?.loginStreak || 0} days
                </div>
                <p className="text-muted-foreground">Current login streak</p>
              </div>
            </CardContent>
          </Card>

          {/* Simple Message */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Enjoy browsing anime and manga with your unique username displayed in your profile!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Gamification;