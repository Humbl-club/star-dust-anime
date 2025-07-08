import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSimpleGameification } from "@/hooks/useSimpleGameification";
import { LootBoxAnimation } from "@/components/LootBoxAnimation";
import { 
  Gift, 
  Star, 
  Crown, 
  Trophy, 
  Sparkles, 
  Package,
  Coins
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

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'GOD': return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    case 'LEGENDARY': return 'bg-gradient-to-r from-purple-400 to-purple-600';
    case 'EPIC': return 'bg-gradient-to-r from-blue-400 to-blue-600';
    case 'RARE': return 'bg-gradient-to-r from-green-400 to-green-600';
    case 'UNCOMMON': return 'bg-gradient-to-r from-gray-400 to-gray-600';
    default: return 'bg-gradient-to-r from-gray-300 to-gray-500';
  }
};

export const LootBoxOpening = () => {
  const { stats, openLootBox, purchaseLootBox } = useSimpleGameification();
  const lootBoxes: any[] = [];
  const isOpeningBox = false;
  const lastOpenedResult = null;
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleOpenBox = async (boxType: string) => {
    console.log('🎁 Opening loot box:', boxType);
    setSelectedBox(boxType);
    setShowAnimation(true);
    
    // Actually open the loot box
    const result = await openLootBox();
    console.log('🎁 Loot box result:', result);
    
    if (!result) {
      setShowAnimation(false);
      setSelectedBox(null);
    }
  };

  const handleCloseAnimation = () => {
    setShowAnimation(false);
    setSelectedBox(null);
  };

  const costs = {
    standard: 100,
    premium: 500,
    ultra: 1000
  };

  return (
    <div className="space-y-6">
      {/* Loot Box Animation Modal */}
      <LootBoxAnimation
        isOpen={showAnimation}
        onClose={handleCloseAnimation}
        boxType={selectedBox as any}
        result={lastOpenedResult}
        isOpening={isOpeningBox}
      />
      {/* Points Display */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            Your Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-primary">{stats?.totalPoints || 0}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-secondary">{stats?.dailyPoints || 0}</div>
              <div className="text-sm text-muted-foreground">Today</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-accent">{stats?.loginStreak || 0}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Username */}
      {stats?.currentUsername && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getTierIcon(stats.usernameTier)}
              Current Username
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-white font-bold ${getTierColor(stats.usernameTier)}`}>
                {stats.currentUsername}
              </div>
              <Badge variant="secondary">{stats.usernameTier}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loot Boxes Inventory */}
      {lootBoxes.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Your Loot Boxes</CardTitle>
            <CardDescription>Open these boxes to get new usernames!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lootBoxes.map((box) => (
                <div key={box.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold capitalize">{box.box_type} Box</h4>
                    <Badge variant="outline">x{box.quantity}</Badge>
                  </div>
                  <Button 
                    onClick={() => handleOpenBox(box.box_type)}
                    disabled={isOpeningBox || box.quantity === 0}
                    className="w-full"
                    variant="hero"
                  >
                    {isOpeningBox && selectedBox === box.box_type ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Opening...
                      </div>
                    ) : (
                      box.quantity > 0 ? 'Open Box' : 'No boxes left'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loot Box Shop */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Loot Box Shop</CardTitle>
          <CardDescription>Purchase loot boxes with your points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Standard Box */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                <h4 className="font-semibold">Standard Box</h4>
                <p className="text-sm text-muted-foreground">Normal odds for all tiers</p>
              </div>
              <div className="space-y-2">
                <div className="text-center font-bold">{costs.standard} Points</div>
                <Progress value={10} className="h-2" />
                <div className="text-xs text-muted-foreground">0.01% GOD chance</div>
              </div>
              <Button 
                onClick={() => purchaseLootBox()}
                disabled={!stats || stats.totalPoints < costs.standard}
                className="w-full"
                variant="outline"
              >
                Purchase
              </Button>
            </div>

            {/* Premium Box */}
            <div className="border border-purple-500/50 rounded-lg p-4 space-y-3 bg-purple-500/5">
              <div className="text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <h4 className="font-semibold">Premium Box</h4>
                <p className="text-sm text-muted-foreground">Better odds!</p>
              </div>
              <div className="space-y-2">
                <div className="text-center font-bold">{costs.premium} Points</div>
                <Progress value={25} className="h-2" />
                <div className="text-xs text-muted-foreground">0.05% GOD chance</div>
              </div>
              <Button 
                onClick={() => purchaseLootBox()}
                disabled={!stats || stats.totalPoints < costs.premium}
                className="w-full"
                variant="secondary"
              >
                Purchase
              </Button>
            </div>

            {/* Ultra Box */}
            <div className="border border-yellow-500/50 rounded-lg p-4 space-y-3 bg-yellow-500/5">
              <div className="text-center">
                <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <h4 className="font-semibold">Ultra Box</h4>
                <p className="text-sm text-muted-foreground">Best odds!</p>
              </div>
              <div className="space-y-2">
                <div className="text-center font-bold">{costs.ultra} Points</div>
                <Progress value={50} className="h-2" />
                <div className="text-xs text-muted-foreground">0.1% GOD chance</div>
              </div>
              <Button 
                onClick={() => purchaseLootBox()}
                disabled={!stats || stats.totalPoints < costs.ultra}
                className="w-full"
                variant="hero"
              >
                Purchase
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Earn Points */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Daily Login</span>
              <Badge variant="outline">10 points</Badge>
            </div>
            <div className="flex justify-between">
              <span>View Anime</span>
              <Badge variant="outline">1 point</Badge>
            </div>
            <div className="flex justify-between">
              <span>Add to Watchlist</span>
              <Badge variant="outline">5 points</Badge>
            </div>
            <div className="flex justify-between">
              <span>Write Review</span>
              <Badge variant="outline">25 points</Badge>
            </div>
            <div className="flex justify-between">
              <span>Complete Anime</span>
              <Badge variant="outline">50 points</Badge>
            </div>
            <div className="flex justify-between">
              <span>7-Day Streak Bonus</span>
              <Badge variant="outline">50 points</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};