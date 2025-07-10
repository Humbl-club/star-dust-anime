import { useState } from "react";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AddToListButton } from "@/components/AddToListButton";
import { Navigation } from "@/components/Navigation";
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Target,
  X,
  Star,
  Play,
  BookOpen,
  Zap,
  RefreshCw
} from "lucide-react";

const Recommendations = () => {
  const { user } = useAuth();
  const { 
    loading, 
    recommendations, 
    generateAIRecommendations, 
    generateGenreRecommendations,
    dismissRecommendation 
  } = useRecommendations();
  
  const [activeTab, setActiveTab] = useState("all");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatingGenre, setGeneratingGenre] = useState(false);

  const animeRecommendations = recommendations.filter(rec => rec.anime_id);
  const mangaRecommendations = recommendations.filter(rec => rec.manga_id);

  const handleGenerateAI = async (contentType: 'anime' | 'manga') => {
    setGeneratingAI(true);
    try {
      await generateAIRecommendations(contentType);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleGenerateGenre = async (contentType: 'anime' | 'manga') => {
    setGeneratingGenre(true);
    try {
      await generateGenreRecommendations(contentType);
    } finally {
      setGeneratingGenre(false);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'ai_generated': return <Brain className="w-4 h-4" />;
      case 'genre_based': return <Target className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'ai_generated': return 'bg-purple-500';
      case 'genre_based': return 'bg-blue-500';
      case 'trending': return 'bg-green-500';
      default: return 'bg-primary';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
            <p className="text-muted-foreground">You need to be signed in to get personalized recommendations.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      {/* Enhanced Header with animated background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-accent text-primary-foreground pt-24 pb-12">
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-repeat bg-center" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M20 20c0 11-9 20-20 20s-20-9-20-20 9-20 20-20 20 9 20 20zm-5 0c0-8.3-6.7-15-15-15s-15 6.7-15 15 6.7 15 15 15 15-6.7 15-15z'/%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-fade-in">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Recommendations
                </h1>
              </div>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
                Discover your next favorite anime and manga with AI-powered suggestions tailored just for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Generation Controls */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-border/30 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-lg shadow-2xl hover:shadow-3xl transition-all duration-300 group">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  <Brain className="w-5 h-5 text-purple-500" />
                </div>
                AI-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Get personalized recommendations based on your watching history and preferences using advanced AI.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleGenerateAI('anime')}
                  disabled={generatingAI || loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
                >
                  {generatingAI ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Anime
                </Button>
                <Button 
                  onClick={() => handleGenerateAI('manga')}
                  disabled={generatingAI || loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
                >
                  {generatingAI ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4 mr-2" />
                  )}
                  Manga
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-lg shadow-2xl hover:shadow-3xl transition-all duration-300 group">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
                Genre-Based Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Find content similar to your favorites based on genres and themes you love.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleGenerateGenre('anime')}
                  disabled={generatingGenre || loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                >
                  {generatingGenre ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Anime
                </Button>
                <Button 
                  onClick={() => handleGenerateGenre('manga')}
                  disabled={generatingGenre || loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                >
                  {generatingGenre ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BookOpen className="w-4 h-4 mr-2" />
                  )}
                  Manga
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Recommendations Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-10 bg-card/50 backdrop-blur-md border border-border/30 p-2 rounded-xl">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300"
            >
              All ({recommendations.length})
            </TabsTrigger>
            <TabsTrigger 
              value="anime"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300"
            >
              Anime ({animeRecommendations.length})
            </TabsTrigger>
            <TabsTrigger 
              value="manga"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300"
            >
              Manga ({mangaRecommendations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <RecommendationsList 
              recommendations={recommendations} 
              onDismiss={dismissRecommendation}
            />
          </TabsContent>

          <TabsContent value="anime">
            <RecommendationsList 
              recommendations={animeRecommendations} 
              onDismiss={dismissRecommendation}
            />
          </TabsContent>

          <TabsContent value="manga">
            <RecommendationsList 
              recommendations={mangaRecommendations} 
              onDismiss={dismissRecommendation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface RecommendationsListProps {
  recommendations: any[];
  onDismiss: (id: string) => void;
}

const RecommendationsList = ({ recommendations, onDismiss }: RecommendationsListProps) => {
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'ai_generated': return <Brain className="w-4 h-4" />;
      case 'genre_based': return <Target className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'ai_generated': return 'bg-purple-500';
      case 'genre_based': return 'bg-blue-500';
      case 'trending': return 'bg-green-500';
      default: return 'bg-primary';
    }
  };

  if (recommendations.length === 0) {
    return (
      <Card className="text-center py-16 border-border/30 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-lg shadow-xl">
        <CardContent>
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="p-6 bg-primary/10 rounded-full">
              <Sparkles className="w-16 h-16 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-gradient-primary">No recommendations yet</h3>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed max-w-md">
                Generate some recommendations using the controls above to get personalized suggestions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <Card key={rec.id} className="border-border/30 bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-lg shadow-lg hover:shadow-xl transition-all duration-300">{/* Enhanced card styling */}
          <CardContent className="p-6">
            <div className="flex gap-4">
              <img 
                src={rec.content?.image_url}
                alt={rec.content?.title}
                className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold line-clamp-1 mb-1">
                      {rec.content?.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getRecommendationColor(rec.recommendation_type)} text-white text-xs`}
                      >
                        {getRecommendationIcon(rec.recommendation_type)}
                        <span className="ml-1">
                          {rec.recommendation_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </Badge>
                      
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-sm">{rec.content?.score || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-blue-400" />
                        <span className="text-sm">{Math.round(rec.confidence_score * 100)}% match</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(rec.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mb-3">
                  <Progress value={rec.confidence_score * 100} className="h-1 mb-2" />
                </div>
                
                {rec.reason && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {rec.reason}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {rec.content?.genres?.slice(0, 3).map((genre: string) => (
                      <Badge key={genre} variant="outline" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                  
                  <AddToListButton 
                    item={rec.content} 
                    type={rec.anime_id ? 'anime' : 'manga'} 
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Recommendations;