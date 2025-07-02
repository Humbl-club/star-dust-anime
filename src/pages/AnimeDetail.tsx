import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Star, 
  Calendar, 
  Play, 
  Clock,
  Users,
  Heart,
  BookOpen,
  ExternalLink
} from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { type Anime } from "@/data/animeData";
import { AddToListButton } from "@/components/AddToListButton";

const AnimeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: allAnime, loading } = useApiData<Anime>({ 
    contentType: 'anime',
    limit: 1000,
    autoFetch: true
  });

  const anime = allAnime.find(a => a.id === id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading anime details...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/anime')}
            className="text-primary-foreground hover:bg-primary-foreground/10 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Anime List
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Anime Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="aspect-[3/4] relative">
                <img 
                  src={anime.image_url} 
                  alt={anime.title}
                  className="w-full h-full object-cover"
                />
                {anime.score && (
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full p-2 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white font-semibold">{anime.score}</span>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Action Buttons */}
            <div className="mt-4 space-y-3">
              <AddToListButton 
                item={anime} 
                type="anime" 
                className="w-full"
              />
              
              {anime.trailer_url && (
                <Button variant="outline" className="w-full">
                  <Play className="w-4 h-4 mr-2" />
                  Watch Trailer
                </Button>
              )}
            </div>
          </div>

          {/* Anime Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-4xl font-bold text-gradient-primary mb-2">
                {anime.title}
              </h1>
              {anime.title_english && anime.title_english !== anime.title && (
                <p className="text-xl text-muted-foreground mb-2">{anime.title_english}</p>
              )}
              {anime.title_japanese && (
                <p className="text-lg text-muted-foreground">{anime.title_japanese}</p>
              )}
            </div>

            {/* Status and Basic Stats */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm">
                {anime.status}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {anime.type}
              </Badge>
              {anime.year && (
                <Badge variant="outline" className="text-sm">
                  {anime.year}
                </Badge>
              )}
            </div>

            {/* Synopsis */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">Synopsis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {anime.synopsis || "No synopsis available."}
                </p>
              </CardContent>
            </Card>

            {/* Details Grid */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {anime.episodes && (
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Episodes:</span>
                      <span className="font-medium">{anime.episodes}</span>
                    </div>
                  )}
                  
                  {anime.aired_from && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Aired:</span>
                      <span className="font-medium">
                        {anime.aired_from}
                        {anime.aired_to && ` to ${anime.aired_to}`}
                      </span>
                    </div>
                  )}
                  
                  {anime.season && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Season:</span>
                      <span className="font-medium">{anime.season}</span>
                    </div>
                  )}
                  
                  {anime.members && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Members:</span>
                      <span className="font-medium">{anime.members.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {anime.favorites && (
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Favorites:</span>
                      <span className="font-medium">{anime.favorites.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {anime.rank && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Rank:</span>
                      <span className="font-medium">#{anime.rank}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {anime.genres.map((genre, index) => (
                      <Badge key={index} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Studios */}
            {anime.studios && anime.studios.length > 0 && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Studios</h3>
                  <div className="flex flex-wrap gap-2">
                    {anime.studios.map((studio, index) => (
                      <Badge key={index} variant="outline">
                        {studio}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Themes */}
            {anime.themes && anime.themes.length > 0 && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {anime.themes.map((theme, index) => (
                      <Badge key={index} variant="outline">
                        {theme}
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

export default AnimeDetail;