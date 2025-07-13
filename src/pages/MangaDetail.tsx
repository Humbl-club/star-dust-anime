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
import { useNamePreference } from "@/hooks/useNamePreference";
import { AddToListButton } from "@/components/AddToListButton";
import { EnhancedRatingComponent } from "@/components/EnhancedRatingComponent";
import { Navigation } from "@/components/Navigation";
import { RichSynopsis } from "@/components/RichSynopsis";
import { useMangaDetail } from "@/hooks/useMangaDetail";

const MangaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showEnglish, setShowEnglish, getDisplayName } = useNamePreference();
  
  // Use the new optimized hook
  const { manga, loading, error } = useMangaDetail(id || '');

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

  if (error || !manga) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {error || 'Manga not found'}
          </h2>
          <Button onClick={() => navigate('/manga')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Manga List
          </Button>
        </div>
      </div>
    );
  }

  // Create a compatible manga object for AddToListButton that matches the Manga type
  const mangaForList = {
    ...manga,
    synopsis: manga.synopsis || '', // Ensure synopsis is never undefined
    image_url: manga.image_url || '', // Ensure image_url is never undefined
    // Transform genres from objects to strings
    genres: manga.genres ? manga.genres.map(genre => genre.name) : [],
    // Transform authors from objects to strings
    authors: manga.authors ? manga.authors.map(author => author.name) : [],
    // Ensure all required Manga properties are present
    mal_id: manga.anilist_id, // Use anilist_id as mal_id fallback
    scored_by: manga.members || 0, // Use members as scored_by fallback
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 relative overflow-hidden">
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

      <div className="container mx-auto px-4 py-8 pt-24 relative z-10">
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
                  item={mangaForList} 
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

            

            {/* Enhanced Rating Component */}
            <div className="mb-8">
              <EnhancedRatingComponent
                contentId={manga.id}
                contentType="manga"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangaDetail;
