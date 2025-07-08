import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, ShoppingCart, Filter, Clock, Crown, Star, Sparkles } from 'lucide-react';
import { AdvancedCharacterDisplay } from '@/components/AdvancedCharacterDisplay';
import { socialService } from '@/services/socialService';
import { useAuth } from '@/hooks/useAuth';
import { useGameification } from '@/hooks/useGameification';
import type { CharacterTradeListing, TradingFilters } from '@/types/social';
import { toast } from 'sonner';

export const CharacterTradingMarket = () => {
  const { user } = useAuth();
  const { stats } = useGameification();
  const [listings, setListings] = useState<CharacterTradeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TradingFilters>({ sortBy: 'date' });

  useEffect(() => {
    loadTradeListings();
    setupRealTimeUpdates();
  }, [filters]);

  const loadTradeListings = async () => {
    setLoading(true);
    try {
      const data = await socialService.getActiveTradeListings(filters);
      setListings(data);
    } catch (error) {
      console.error('Error loading trade listings:', error);
      toast.error('Failed to load trading market');
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    const subscription = socialService.subscribeToTradeListings((payload) => {
      console.log('Real-time trade update:', payload);
      loadTradeListings();
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const handlePurchase = async (listing: CharacterTradeListing) => {
    if (!user || !stats) return;

    if (stats.totalPoints < listing.asking_price) {
      toast.error(`Not enough points! You need ${listing.asking_price} points.`);
      return;
    }

    try {
      const success = await socialService.purchaseCharacter(listing.id, user.id);
      if (success) {
        toast.success(`Successfully purchased ${listing.character_id}!`);
        loadTradeListings(); // Refresh listings
      } else {
        toast.error('Failed to purchase character');
      }
    } catch (error) {
      console.error('Error purchasing character:', error);
      toast.error('Failed to purchase character');
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'GOD': return Crown;
      case 'LEGENDARY': return Star;
      case 'EPIC': return Sparkles;
      default: return Coins;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Character Trading Market</h1>
          <p className="text-muted-foreground">Buy and sell legendary characters</p>
        </div>
        
        {stats && (
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">{stats.totalPoints.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">points</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Market Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select 
                value={filters.sortBy} 
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="date">Newest First</SelectItem>
                  <SelectItem value="tier">By Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Min Price</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  minPrice: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Max Price</label>
              <Input
                type="number"
                placeholder="No limit"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  maxPrice: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
              />
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ sortBy: 'date' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Listings */}
      {listings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Active Listings</h3>
            <p className="text-muted-foreground">Check back later for new character listings!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TradingCard 
                listing={listing}
                onPurchase={handlePurchase}
                canAfford={stats ? stats.totalPoints >= listing.asking_price : false}
                timeRemaining={getTimeRemaining(listing.expires_at)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

interface TradingCardProps {
  listing: CharacterTradeListing;
  onPurchase: (listing: CharacterTradeListing) => void;
  canAfford: boolean;
  timeRemaining: string;
}

const TradingCard = ({ listing, onPurchase, canAfford, timeRemaining }: TradingCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {/* Mock character preview */}
        <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <div className="text-center">
            <Coins className="w-12 h-12 mx-auto mb-2 text-primary" />
            <div className="text-sm font-medium">Character #{listing.character_id.slice(-6)}</div>
          </div>
        </div>
        
        {/* Expiry indicator */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeRemaining}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Badge variant="outline">Mock Tier</Badge>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Price</div>
              <div className="font-bold text-lg flex items-center gap-1">
                <Coins className="w-4 h-4" />
                {listing.asking_price.toLocaleString()}
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => onPurchase(listing)}
            disabled={!canAfford}
            className="w-full"
            variant={canAfford ? 'default' : 'outline'}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {canAfford ? 'Purchase' : 'Insufficient Points'}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            Listed {new Date(listing.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};