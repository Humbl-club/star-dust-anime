import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Grid, List, Crown, Star, Sparkles, Gem } from 'lucide-react';
import { AdvancedCharacterDisplay } from '@/components/AdvancedCharacterDisplay';
export { EnhancedCharacterCollection } from '@/components/StubComponents';
import type { GeneratedCharacter } from '@/types/character';

interface CollectionFilters {
  tier: string;
  searchTerm: string;
  sortBy: 'name' | 'tier' | 'date';
  viewMode: 'grid' | 'list';
}

export const EnhancedCharacterCollection = () => {
  const { getUsernameCollection } = useGameification();
  const [characters, setCharacters] = useState<GeneratedCharacter[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<GeneratedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CollectionFilters>({
    tier: 'all',
    searchTerm: '',
    sortBy: 'tier',
    viewMode: 'grid'
  });

  useEffect(() => {
    loadCollection();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [characters, filters]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const collection = await getUsernameCollection();
      
      // Convert to GeneratedCharacter format (mock data for now)
      const enhancedCollection: GeneratedCharacter[] = collection.map((item: any) => ({
        id: crypto.randomUUID(),
        username: item.username,
        tier: item.tier,
        generation_method: 'procedural' as const,
        character_data: {
          template: {
            id: 'mock',
            tier: item.tier,
            template_name: `${item.tier} Template`,
            base_config: { style: 'anime', accessories: [], pose: 'standing' },
            color_palette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
            animation_style: 'standard',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          variation: {
            id: 'mock',
            template_id: 'mock',
            variation_name: 'Default',
            variation_config: { hair_style: 'medium', outfit_style: 'classic', color_variant: 0 },
            rarity_weight: 1,
            created_at: new Date().toISOString()
          },
          animation: {
            id: 'mock',
            animation_name: 'standard_walk',
            animation_type: 'walk_out',
            duration_ms: 2000,
            animation_config: { effects: ['basic_glow'], movement: 'walk' },
            tier_compatibility: [item.tier],
            created_at: new Date().toISOString()
          },
          visual_data: {
            hair_color: '#8B4513',
            eye_color: '#1E90FF',
            outfit_color: '#4682B4',
            accessory_color: '#FFD700',
            skin_tone: '#FDBCB4',
            special_effects: ['basic_glow']
          },
          personality_traits: ['Friendly', 'Determined'],
          description: `A ${item.tier.toLowerCase()} tier character ready for adventure.`
        },
        cached_at: item.claimed_at,
        cache_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      setCharacters(enhancedCollection);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...characters];

    // Filter by tier
    if (filters.tier !== 'all') {
      filtered = filtered.filter(char => char.tier === filters.tier);
    }

    // Filter by search term
    if (filters.searchTerm) {
      filtered = filtered.filter(char =>
        char.username.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        char.character_data.personality_traits.some(trait =>
          trait.toLowerCase().includes(filters.searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.username.localeCompare(b.username);
        case 'tier':
          const tierOrder = { 'GOD': 6, 'LEGENDARY': 5, 'EPIC': 4, 'RARE': 3, 'UNCOMMON': 2, 'COMMON': 1 };
          return tierOrder[b.tier] - tierOrder[a.tier];
        case 'date':
          return new Date(b.cached_at).getTime() - new Date(a.cached_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredCharacters(filtered);
  };

  const tierStats = characters.reduce((acc, char) => {
    acc[char.tier] = (acc[char.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tierIcons = {
    GOD: Crown,
    LEGENDARY: Star,
    EPIC: Sparkles,
    RARE: Gem,
    UNCOMMON: Filter,
    COMMON: Grid
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
          <h1 className="text-3xl font-bold">Character Collection</h1>
          <p className="text-muted-foreground">Your legendary anime character collection</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filters.viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, viewMode: 'grid' }))}
          >
            <Grid size={16} />
          </Button>
          <Button
            variant={filters.viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, viewMode: 'list' }))}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(tierStats).map(([tier, count]) => {
          const Icon = tierIcons[tier as keyof typeof tierIcons] || Grid;
          return (
            <Card key={tier} className="text-center">
              <CardContent className="p-4">
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">{tier}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search characters..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.tier} onValueChange={(value) => setFilters(prev => ({ ...prev, tier: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="GOD">GOD</SelectItem>
                <SelectItem value="LEGENDARY">LEGENDARY</SelectItem>
                <SelectItem value="EPIC">EPIC</SelectItem>
                <SelectItem value="RARE">RARE</SelectItem>
                <SelectItem value="UNCOMMON">UNCOMMON</SelectItem>
                <SelectItem value="COMMON">COMMON</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.sortBy} onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tier">Tier (Highest First)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="date">Date Collected</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setFilters({ tier: 'all', searchTerm: '', sortBy: 'tier', viewMode: 'grid' })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Character Grid/List */}
      {filteredCharacters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {characters.length === 0 ? (
                <>
                  <Gem className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Characters Yet</h3>
                  <p>Open loot boxes to start building your collection!</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Matches Found</h3>
                  <p>Try adjusting your filters or search terms.</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className={filters.viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }
          layout
        >
          {filteredCharacters.map((character, index) => (
            <motion.div
              key={character.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {filters.viewMode === 'grid' ? (
                <AdvancedCharacterDisplay
                  character={character}
                  showDetails={true}
                  showAnimation={false}
                  size="medium"
                />
              ) : (
                <Card className="flex flex-row items-center p-4 space-x-4">
                  <div className="flex-shrink-0">
                    <AdvancedCharacterDisplay
                      character={character}
                      showDetails={false}
                      showAnimation={false}
                      size="small"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{character.username}</h3>
                      <Badge variant="outline">
                        {character.tier}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {character.character_data.personality_traits.map((trait) => (
                        <Badge key={trait} variant="secondary" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {character.character_data.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Collected: {new Date(character.cached_at).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};