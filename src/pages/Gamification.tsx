import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { EnhancedLootBoxOpening } from "@/components/EnhancedLootBoxOpening";
import { useGameification } from "@/hooks/useGameification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Trophy, 
  Star, 
  Sparkles, 
  Gift, 
  Package,
  History,
  Target
} from "lucide-react";

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'GOD': return <Crown className="w-4 h-4 text-yellow-500" />;
    case 'LEGENDARY': return <Trophy className="w-4 h-4 text-purple-500" />;
    case 'EPIC': return <Star className="w-4 h-4 text-blue-500" />;
    case 'RARE': return <Sparkles className="w-4 h-4 text-green-500" />;
    case 'UNCOMMON': return <Gift className="w-4 h-4 text-gray-500" />;
    default: return <Package className="w-4 h-4 text-gray-400" />;
  }
};

const Gamification = () => {
  const { getUsernameCollection } = useGameification();
  const [collection, setCollection] = useState<any[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(false);

  const loadCollection = async () => {
    setLoadingCollection(true);
    const userCollection = await getUsernameCollection();
    setCollection(userCollection);
    setLoadingCollection(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gradient-primary">
              Gamification Hub
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Collect legendary usernames, earn points, and unlock exclusive rewards!
          </p>
        </div>

        <Tabs defaultValue="lootboxes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lootboxes" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Loot Boxes
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Collection
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              System Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lootboxes">
            <EnhancedLootBoxOpening />
          </TabsContent>

          <TabsContent value="collection">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Your Username Collection</CardTitle>
                <CardDescription>All the usernames you've discovered</CardDescription>
              </CardHeader>
              <CardContent>
                {!collection.length ? (
                  <div className="text-center py-8">
                    <button 
                      onClick={loadCollection}
                      disabled={loadingCollection}
                      className="text-primary hover:underline"
                    >
                      {loadingCollection ? 'Loading...' : 'Load Your Collection'}
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {collection.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTierIcon(item.tier)}
                          <span className="font-semibold">{item.username}</span>
                          <Badge variant="outline">{item.tier}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.acquired_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="space-y-6">
              {/* Tier System Explanation */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Username Tier System</CardTitle>
                  <CardDescription>Understanding the rarity system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-600/10">
                      <div className="flex items-center gap-3">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        <div>
                          <div className="font-bold">GOD TIER</div>
                          <div className="text-sm text-muted-foreground">Unique main characters only</div>
                        </div>
                      </div>
                      <Badge variant="outline">0.01% chance</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-600/10">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-purple-500" />
                        <div>
                          <div className="font-bold">LEGENDARY</div>
                          <div className="text-sm text-muted-foreground">Popular side characters + main chars with numbers</div>
                        </div>
                      </div>
                      <Badge variant="outline">0.5% chance</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="font-bold">EPIC</div>
                          <div className="text-sm text-muted-foreground">Secondary characters with numbers</div>
                        </div>
                      </div>
                      <Badge variant="outline">5% chance</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/10">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-green-500" />
                        <div>
                          <div className="font-bold">RARE</div>
                          <div className="text-sm text-muted-foreground">Supporting characters with numbers</div>
                        </div>
                      </div>
                      <Badge variant="outline">15% chance</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-bold">UNCOMMON</div>
                          <div className="text-sm text-muted-foreground">Generic anime terms with numbers</div>
                        </div>
                      </div>
                      <Badge variant="outline">30% chance</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-bold">COMMON</div>
                          <div className="text-sm text-muted-foreground">Basic anime-themed names with numbers</div>
                        </div>
                      </div>
                      <Badge variant="outline">49.49% chance</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scaling Information */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>System Features</CardTitle>
                  <CardDescription>Built for massive scale</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <p>• <strong>GOD TIER Exclusivity:</strong> Once a GOD TIER username is taken, it's gone forever</p>
                    <p>• <strong>Points System:</strong> Earn points through daily activities and app engagement</p>
                    <p>• <strong>Loot Box System:</strong> Three tiers of boxes with different odds</p>
                    <p>• <strong>Social Status:</strong> Your username becomes your identity in the community</p>
                    <p>• <strong>Scalable Architecture:</strong> Designed to handle 100K+ daily active users</p>
                    <p>• <strong>Real-time Updates:</strong> Live notifications for legendary acquisitions</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Gamification;