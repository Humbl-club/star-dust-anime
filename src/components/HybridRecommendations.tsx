import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimeCard } from './AnimeCard';
import { useHybridRecommendations } from '@/hooks/useHybridRecommendations';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  TrendingUp, 
  Heart, 
  Users, 
  RefreshCw,
  Info
} from 'lucide-react';

export const HybridRecommendations = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { recommendations, loading, refreshRecommendations } = useHybridRecommendations();
  const navigate = useNavigate();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ai': return <Sparkles className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      case 'content': return <Heart className="w-4 h-4" />;
      case 'collaborative': return <Users className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ai': return 'bg-primary/10 text-primary border-primary/20';
      case 'trending': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'content': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'collaborative': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const filterByType = (type: string) => {
    if (type === 'all') return recommendations;
    return recommendations.filter(rec => rec.recommendationType === type);
  };

  const handleAnimeClick = (anime: any) => {
    navigate(`/anime/${anime.id}`);
  };

  const filteredRecs = filterByType(activeTab);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Smart Recommendations
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {recommendations.length} found
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshRecommendations}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4" />
          <span>AI-powered recommendations with cost optimization</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="text-xs">
              All ({recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs">
              For You ({recommendations.filter(r => r.recommendationType === 'content').length})
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-xs">
              Trending ({recommendations.filter(r => r.recommendationType === 'trending').length})
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              AI ({recommendations.filter(r => r.recommendationType === 'ai').length})
            </TabsTrigger>
            <TabsTrigger value="collaborative" className="text-xs">
              Community ({recommendations.filter(r => r.recommendationType === 'collaborative').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-64 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredRecs.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredRecs.map((rec, index) => (
                    <div 
                      key={rec.id}
                      className="relative animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <AnimeCard 
                        anime={rec as any} 
                        onClick={() => handleAnimeClick(rec)}
                      />
                      
                      {/* Recommendation Type Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTypeColor(rec.recommendationType)}`}
                        >
                          {getTypeIcon(rec.recommendationType)}
                          <span className="ml-1 capitalize">
                            {rec.recommendationType === 'content' ? 'For You' : 
                             rec.recommendationType === 'collaborative' ? 'Community' :
                             rec.recommendationType}
                          </span>
                        </Badge>
                      </div>

                      {/* Confidence Score */}
                      {rec.confidence && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-background/80 backdrop-blur-sm"
                          >
                            {Math.round(rec.confidence * 100)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recommendation Statistics */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
                  {['content', 'trending', 'ai', 'collaborative'].map(type => {
                    const count = recommendations.filter(r => r.recommendationType === type).length;
                    if (count === 0) return null;
                    
                    return (
                      <div key={type} className="flex items-center gap-2 text-sm">
                        {getTypeIcon(type)}
                        <span className="capitalize">
                          {type === 'content' ? 'Content-based' : 
                           type === 'collaborative' ? 'Collaborative' : type}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Rate some anime to get personalized recommendations!
                </p>
                <Button onClick={refreshRecommendations} disabled={loading}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Recommendations
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};