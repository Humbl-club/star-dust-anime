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
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Recommendations
              </h1>
            </div>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Discover your next favorite anime and manga with AI-powered suggestions.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Generation Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                AI-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Get personalized recommendations based on your watching history and preferences using advanced AI.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleGenerateAI('anime')}
                  disabled={generatingAI || loading}
                  className="flex-1"
                  variant="outline"
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
                  className="flex-1"
                  variant="outline"
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

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Genre-Based Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Find content similar to your favorites based on genres and themes you love.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleGenerateGenre('anime')}
                  disabled={generatingGenre || loading}
                  className="flex-1"
                  variant="outline"
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
                  className="flex-1"
                  variant="outline"
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

        {/* Recommendations */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
            <TabsTrigger value="anime">Anime ({animeRecommendations.length})</TabsTrigger>
            <TabsTrigger value="manga">Manga ({mangaRecommendations.length})</TabsTrigger>
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
      <Card className="text-center py-12 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <Sparkles className="w-16 h-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
              <p className="text-muted-foreground mb-4">
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
        <Card key={rec.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
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