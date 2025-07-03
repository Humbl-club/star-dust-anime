import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Star, 
  Calendar, 
  Users,
  Heart,
  BookOpen,
  ExternalLink,
  Share2,
  Bookmark,
  TrendingUp,
  Award,
  Zap,
  Book,
  FileText
} from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { useNamePreference } from "@/hooks/useNamePreference";
import { type Manga } from "@/data/animeData";
import { AddToListButton } from "@/components/AddToListButton";
import { NameToggle } from "@/components/NameToggle";
import { Navigation } from "@/components/Navigation";

const MangaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showEnglish, setShowEnglish, getDisplayName } = useNamePreference();
  
  const { data: allManga, loading } = useApiData<Manga>({ 
    contentType: 'manga',
    limit: 1000,
    autoFetch: true
  });

  const manga = allManga.find(m => m.id === id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading manga details...</p>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Manga not found</h2>
          <Button onClick={() => navigate('/manga')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Manga List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 relative">
      <NameToggle showEnglish={showEnglish} onToggle={setShowEnglish} />
      <Navigation />
      
      {/* Hero Background with blurred cover */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${manga.image_url})`,
            filter: 'blur(20px) brightness(0.3)',
            transform: 'scale(1.1)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/90" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gradient-primary/90 backdrop-blur-sm text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/manga')}
            className="text-primary-foreground hover:bg-primary-foreground/10 mb-4 animate-fade-in"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Manga List
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Manga Image & Actions */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <Card className="overflow-hidden border-border/50 bg-card/90 backdrop-blur-sm shadow-2xl animate-scale-in">
                <div className="aspect-[3/4] relative group">
                  <img 
                    src={manga.image_url} 
                    alt={getDisplayName(manga)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Floating Score Badge */}
                  {manga.score && (
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-full p-3 flex items-center gap-2 shadow-lg">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-white font-bold text-lg">
                        {manga.score}
                      </span>
                    </div>
                  )}
                  
                  {/* Rank Badge */}
                  {manga.rank && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-2 flex items-center gap-1 shadow-lg">
                      <Award className="w-4 h-4 text-white" />
                      <span className="text-white font-bold text-sm">#{manga.rank}</span>
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Action Buttons */}
              <div className="mt-6 space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <AddToListButton 
                  item={manga} 
                  type="manga" 
                  className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg"
                />
                
                <Button variant="outline" className="w-full border-secondary/30 hover:bg-secondary/10">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on MyAnimeList
                </Button>
              </div>
            </div>
          </div>

          {/* Manga Details */}
          <div className="lg:col-span-3 space-y-8">
            {/* Title and Basic Info */}
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-5xl font-bold text-gradient-primary mb-4 leading-tight">
                {getDisplayName(manga)}
              </h1>
              
              {/* Alternative titles */}
              <div className="space-y-2 mb-6">
                {manga.title_english && manga.title_english !== manga.title && (
                  <p className="text-xl text-muted-foreground">
                    <span className="text-sm font-medium text-primary">English:</span> {manga.title_english}
                  </p>
                )}
                {manga.title_japanese && (
                  <p className="text-lg text-muted-foreground">
                    <span className="text-sm font-medium text-primary">Japanese:</span> {manga.title_japanese}
                  </p>
                )}
              </div>
            </div>

            {/* Status and Stats */}
            <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Badge variant="default" className="px-4 py-2 text-base bg-gradient-to-r from-primary to-primary-glow">
                {manga.status}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-base border-secondary/30">
                {manga.type}
              </Badge>
              {manga.popularity && (
                <Badge variant="outline" className="px-4 py-2 text-base border-yellow-500/30 text-yellow-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  #{manga.popularity}
                </Badge>
              )}
            </div>

            {/* Quick Stats Bar */}
            {manga.score && (
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {manga.score}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Star className="w-3 h-3" />
                      Score
                    </div>
                  </div>
                  
                  {manga.members && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-secondary mb-1">
                        {(manga.members / 1000).toFixed(0)}K
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" />
                        Members
                      </div>
                    </div>
                  )}
                  
                  {manga.favorites && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent mb-1">
                        {(manga.favorites / 1000).toFixed(0)}K
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3" />
                        Favorites
                      </div>
                    </div>
                  )}
                  
                  {manga.chapters && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary-glow mb-1">{manga.chapters}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <FileText className="w-3 h-3" />
                        Chapters
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Score Progress Bar */}
                {manga.score && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Rating</span>
                      <span className="text-sm text-muted-foreground">
                        {manga.score}/10
                      </span>
                    </div>
                    <Progress 
                      value={(manga.score / 10) * 100} 
                      className="h-2 bg-muted/30"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Synopsis */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  Synopsis
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {manga.synopsis || "No synopsis available."}
                </p>
              </CardContent>
            </Card>

            {/* Details Grid */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-primary" />
                  Details
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {manga.chapters && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">Chapters</span>
                        <span className="font-semibold text-lg">{manga.chapters}</span>
                      </div>
                    </div>
                  )}
                  
                  {manga.volumes && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Book className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">Volumes</span>
                        <span className="font-semibold text-lg">{manga.volumes}</span>
                      </div>
                    </div>
                  )}
                  
                  {manga.published_from && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">Published</span>
                        <span className="font-semibold">
                          {manga.published_from}
                          {manga.published_to && ` to ${manga.published_to}`}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {manga.rank && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Award className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">Rank</span>
                        <span className="font-semibold">#{manga.rank}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Genres */}
            {manga.genres && manga.genres.length > 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Genres</h3>
                  <div className="flex flex-wrap gap-3">
                    {manga.genres.map((genre, index) => (
                      <Badge 
                        key={genre} 
                        variant="secondary" 
                        className="px-4 py-2 text-base hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Authors */}
            {manga.authors && manga.authors.length > 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '0.7s' }}>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Authors</h3>
                  <div className="flex flex-wrap gap-3">
                    {manga.authors.map((author, index) => (
                      <Badge 
                        key={author} 
                        variant="outline" 
                        className="px-4 py-2 text-base border-primary/30 hover:bg-primary/10 transition-colors cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                      >
                        {author}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Serializations */}
            {manga.serializations && manga.serializations.length > 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Serializations</h3>
                  <div className="flex flex-wrap gap-3">
                    {manga.serializations.map((serialization, index) => (
                      <Badge 
                        key={serialization} 
                        variant="outline" 
                        className="px-4 py-2 text-base border-secondary/30 hover:bg-secondary/10 transition-colors cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${0.9 + index * 0.1}s` }}
                      >
                        {serialization}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangaDetail;