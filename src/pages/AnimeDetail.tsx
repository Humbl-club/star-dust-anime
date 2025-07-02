import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Star, 
  Calendar, 
  Play, 
  Clock,
  Users,
  Heart,
  BookOpen,
  ExternalLink,
  Share2,
  Bookmark,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { useAniListData } from "@/hooks/useAniListData";
import { useNamePreference } from "@/hooks/useNamePreference";
import { type Anime } from "@/data/animeData";
import { AddToListButton } from "@/components/AddToListButton";
import { NameToggle } from "@/components/NameToggle";
import { CharacterSection } from "@/components/CharacterSection";
import { StreamingLinks } from "@/components/StreamingLinks";

const AnimeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showEnglish, setShowEnglish, getDisplayName } = useNamePreference();
  
  const { data: allAnime, loading } = useApiData<Anime>({ 
    contentType: 'anime',
    limit: 1000,
    autoFetch: true
  });

  const anime = allAnime.find(a => a.id === id);

  // Fetch enhanced AniList data using MAL ID
  const { 
    data: anilistData, 
    loading: anilistLoading, 
    getEnhancedData 
  } = useAniListData({
    malId: anime?.mal_id,
    autoFetch: !!anime?.mal_id
  });

  // Merge MAL and AniList data for enhanced experience
  const enhancedAnime = anime ? getEnhancedData(anime) : null;

  if (loading || anilistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading anime details...</p>
          {anilistLoading && <p className="text-sm text-muted-foreground">Fetching high-quality images...</p>}
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Anime not found</h2>
          <Button onClick={() => navigate('/anime')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Anime List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 relative">
      {/* Name Toggle */}
      <NameToggle showEnglish={showEnglish} onToggle={setShowEnglish} />
      
      {/* Hero Background with AniList banner or blurred cover */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${enhancedAnime?.banner_image || enhancedAnime?.image_url || anime.image_url})`,
            filter: 'blur(20px) brightness(0.3)',
            transform: 'scale(1.1)'
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: enhancedAnime?.color_theme 
              ? `linear-gradient(to bottom, ${enhancedAnime.color_theme}10, rgba(0,0,0,0.9))` 
              : 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.9))'
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gradient-primary/90 backdrop-blur-sm text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/anime')}
            className="text-primary-foreground hover:bg-primary-foreground/10 mb-4 animate-fade-in"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Anime List
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Anime Image & Actions */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <Card className="overflow-hidden border-border/50 bg-card/90 backdrop-blur-sm shadow-2xl animate-scale-in">
                <div className="aspect-[3/4] relative group">
                  <img 
                    src={enhancedAnime?.image_url || anime.image_url} 
                    alt={getDisplayName(anime)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Floating Score Badge with AniList score if available */}
                  {(enhancedAnime?.anilist_score || anime.score) && (
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-full p-3 flex items-center gap-2 shadow-lg">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-white font-bold text-lg">
                        {enhancedAnime?.anilist_score || anime.score}
                      </span>
                    </div>
                  )}
                  
                  {/* Rank Badge */}
                  {anime.rank && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-2 flex items-center gap-1 shadow-lg">
                      <Award className="w-4 h-4 text-white" />
                      <span className="text-white font-bold text-sm">#{anime.rank}</span>
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
                  item={anime} 
                  type="anime" 
                  className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg"
                />
                
                {enhancedAnime?.trailer && (
                  <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10 group">
                    <Play className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                    Watch Trailer
                  </Button>
                )}
                
                <Button variant="outline" className="w-full border-secondary/30 hover:bg-secondary/10">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on MyAnimeList
                </Button>
              </div>
            </div>
          </div>

          {/* Anime Details */}
          <div className="lg:col-span-3 space-y-8">
            {/* Title and Basic Info */}
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-5xl font-bold text-gradient-primary mb-4 leading-tight">
                {getDisplayName(anime)}
              </h1>
              
              {/* Alternative titles */}
              <div className="space-y-2 mb-6">
                {anime.title_english && anime.title_english !== anime.title && (
                  <p className="text-xl text-muted-foreground">
                    <span className="text-sm font-medium text-primary">English:</span> {anime.title_english}
                  </p>
                )}
                {anime.title_japanese && (
                  <p className="text-lg text-muted-foreground">
                    <span className="text-sm font-medium text-primary">Japanese:</span> {anime.title_japanese}
                  </p>
                )}
              </div>
            </div>

            {/* Status and Stats */}
            <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Badge variant="default" className="px-4 py-2 text-base bg-gradient-to-r from-primary to-primary-glow">
                {anime.status}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-base border-secondary/30">
                {anime.type}
              </Badge>
              {anime.year && (
                <Badge variant="outline" className="px-4 py-2 text-base border-accent/30">
                  {anime.year}
                </Badge>
              )}
              {anime.popularity && (
                <Badge variant="outline" className="px-4 py-2 text-base border-yellow-500/30 text-yellow-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  #{anime.popularity}
                </Badge>
              )}
            </div>

            {/* Quick Stats Bar with enhanced AniList data */}
            {(enhancedAnime?.anilist_score || anime.score) && (
              <div 
                className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/30 animate-fade-in" 
                style={{ 
                  animationDelay: '0.3s',
                  borderColor: enhancedAnime?.color_theme ? `${enhancedAnime.color_theme}30` : undefined
                }}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {enhancedAnime?.anilist_score || anime.score}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Star className="w-3 h-3" />
                      {enhancedAnime?.anilist_score ? 'AniList Score' : 'Score'}
                    </div>
                  </div>
                  
                  {anime.members && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-secondary mb-1">
                        {(anime.members / 1000).toFixed(0)}K
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" />
                        Members
                      </div>
                    </div>
                  )}
                  
                  {anime.favorites && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent mb-1">
                        {(anime.favorites / 1000).toFixed(0)}K
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3" />
                        Favorites
                      </div>
                    </div>
                  )}
                  
                  {anime.episodes && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary-glow mb-1">{anime.episodes}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Play className="w-3 h-3" />
                        Episodes
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Score Progress Bar with AniList score */}
                {(enhancedAnime?.anilist_score || anime.score) && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Rating</span>
                      <span className="text-sm text-muted-foreground">
                        {enhancedAnime?.anilist_score || anime.score}/10
                      </span>
                    </div>
                    <Progress 
                      value={((enhancedAnime?.anilist_score || anime.score) / 10) * 100} 
                      className="h-2 bg-muted/30"
                      style={{
                        background: enhancedAnime?.color_theme ? `${enhancedAnime.color_theme}20` : undefined
                      }}
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
                  {anime.synopsis || "No synopsis available."}
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
                  {anime.episodes && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Play className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">Episodes</span>
                        <span className="font-semibold text-lg">{anime.episodes}</span>
                      </div>
                    </div>
                  )}
                  
                  {anime.aired_from && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">Aired</span>
                        <span className="font-semibold">
                          {anime.aired_from}
                          {anime.aired_to && ` to ${anime.aired_to}`}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {anime.season && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Clock className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">Season</span>
                        <span className="font-semibold">{anime.season}</span>
                      </div>
                    </div>
                  )}
                  
                  {anime.rank && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Award className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">Rank</span>
                        <span className="font-semibold">#{anime.rank}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Genres</h3>
                  <div className="flex flex-wrap gap-3">
                    {anime.genres.map((genre, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="px-4 py-2 text-base hover:bg-secondary/80 hover:scale-105 transition-all duration-200 cursor-pointer"
                        style={{ animationDelay: `${0.7 + (index * 0.05)}s` }}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Studios */}
            {anime.studios && anime.studios.length > 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '0.7s' }}>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Studios</h3>
                  <div className="flex flex-wrap gap-3">
                    {anime.studios.map((studio, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="px-4 py-2 text-base border-primary/30 hover:bg-primary/10 hover:scale-105 transition-all duration-200 cursor-pointer"
                      >
                        {studio}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Themes */}
            {anime.themes && anime.themes.length > 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Themes</h3>
                  <div className="flex flex-wrap gap-3">
                    {anime.themes.map((theme, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="px-4 py-2 text-base border-accent/30 hover:bg-accent/10 hover:scale-105 transition-all duration-200 cursor-pointer"
                      >
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AniList Enhanced Sections */}
            {enhancedAnime?.characters && enhancedAnime.characters.length > 0 && (
              <CharacterSection 
                characters={enhancedAnime.characters} 
                colorTheme={enhancedAnime.color_theme}
              />
            )}

            {enhancedAnime?.external_links && enhancedAnime.external_links.length > 0 && (
              <StreamingLinks 
                externalLinks={enhancedAnime.external_links}
                colorTheme={enhancedAnime.color_theme}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeDetail;