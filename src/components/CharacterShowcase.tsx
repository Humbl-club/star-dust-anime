import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Eye, Share2, Star, Filter, Grid, List } from 'lucide-react';
import { AdvancedCharacterDisplay } from '@/components/AdvancedCharacterDisplay';
import { socialService } from '@/services/socialService';
import { useAuth } from '@/hooks/useAuth';
import type { CharacterShowcase, ShowcaseFilters } from '@/types/social';
import type { GeneratedCharacter } from '@/types/character';
import { toast } from 'sonner';

export const CharacterShowcaseGallery = () => {
  const { user } = useAuth();
  const [showcases, setShowcases] = useState<CharacterShowcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ShowcaseFilters>({ sortBy: 'likes' });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [likedShowcases, setLikedShowcases] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadShowcases();
    setupRealTimeUpdates();
  }, [filters]);

  const loadShowcases = async () => {
    setLoading(true);
    try {
      const data = await socialService.getPublicShowcases(filters);
      setShowcases(data);
      
      // Load user's liked showcases
      if (user) {
        // This would be implemented with a proper API call
        const userLikes = new Set<string>(); // Mock data
        setLikedShowcases(userLikes);
      }
    } catch (error) {
      console.error('Error loading showcases:', error);
      toast.error('Failed to load character showcases');
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    const subscription = socialService.subscribeToShowcases((payload) => {
      console.log('Real-time showcase update:', payload);
      loadShowcases(); // Refresh showcases on changes
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleLike = async (showcaseId: string) => {
    if (!user) return;
    
    try {
      const isLiked = likedShowcases.has(showcaseId);
      
      if (isLiked) {
        await socialService.unlikeShowcase(showcaseId, user.id);
        setLikedShowcases(prev => {
          const newSet = new Set(prev);
          newSet.delete(showcaseId);
          return newSet;
        });
      } else {
        await socialService.likeShowcase(showcaseId, user.id);
        setLikedShowcases(prev => new Set(prev).add(showcaseId));
      }
      
      // Update local showcase data
      setShowcases(prev => prev.map(showcase => 
        showcase.id === showcaseId 
          ? { ...showcase, like_count: showcase.like_count + (isLiked ? -1 : 1) }
          : showcase
      ));
    } catch (error) {
      console.error('Error liking showcase:', error);
      toast.error('Failed to like showcase');
    }
  };

  const handleShare = async (showcase: CharacterShowcase) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: showcase.title,
          text: showcase.description,
          url: `${window.location.origin}/showcase/${showcase.id}`
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/showcase/${showcase.id}`);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
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
          <h1 className="text-3xl font-bold">Character Showcase</h1>
          <p className="text-muted-foreground">Discover amazing characters from the community</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid size={16} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="likes">Most Liked</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="date">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Show Featured</label>
              <Button
                variant={filters.featured ? 'default' : 'outline'}
                onClick={() => setFilters(prev => ({ ...prev, featured: !prev.featured }))}
                className="w-full justify-start"
              >
                <Star className="w-4 h-4 mr-2" />
                {filters.featured ? 'Featured Only' : 'All Showcases'}
              </Button>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ sortBy: 'likes' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Showcases Grid/List */}
      {showcases.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Showcases Found</h3>
            <p className="text-muted-foreground">Be the first to create a character showcase!</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }
          layout
        >
          {showcases.map((showcase, index) => (
            <motion.div
              key={showcase.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ShowcaseCard
                showcase={showcase}
                isLiked={likedShowcases.has(showcase.id)}
                onLike={() => handleLike(showcase.id)}
                onShare={() => handleShare(showcase)}
                viewMode={viewMode}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

interface ShowcaseCardProps {
  showcase: CharacterShowcase;
  isLiked: boolean;
  onLike: () => void;
  onShare: () => void;
  viewMode: 'grid' | 'list';
}

const ShowcaseCard = ({ showcase, isLiked, onLike, onShare, viewMode }: ShowcaseCardProps) => {
  return (
    <Card className={`overflow-hidden ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
      <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
        {/* Mock character display - would integrate with actual character data */}
        <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <div className="text-center">
            <Star className="w-12 h-12 mx-auto mb-2 text-primary" />
            <div className="text-sm font-medium">Character Preview</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg line-clamp-1">{showcase.title}</h3>
          {showcase.featured && (
            <Badge variant="secondary">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
        
        {showcase.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {showcase.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className={isLiked ? 'text-red-500' : ''}
            >
              <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {showcase.like_count}
            </Button>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              {showcase.view_count}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};