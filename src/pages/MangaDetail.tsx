
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, Book, BookOpen } from "lucide-react";
import { useNamePreference } from "@/hooks/useNamePreference";
import { AddToListButton } from "@/components/AddToListButton";
import { ScoreValidationComponent } from "@/components/ScoreValidationComponent";
import { RichSynopsis } from "@/components/RichSynopsis";
import { useMangaDetail } from "@/hooks/useMangaDetail";
import { DetailPageLayout } from "@/components/DetailPageLayout";
import { DetailStatsBar } from "@/components/DetailStatsBar";
import { DetailImageCard } from "@/components/DetailImageCard";
import { DetailInfoGrid } from "@/components/DetailInfoGrid";


const MangaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDisplayName } = useNamePreference();
  
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

  // Create a compatible manga object for AddToListButton
  const mangaForList = {
    ...manga,
    synopsis: manga.synopsis || '',
    image_url: manga.image_url || '',
    genres: manga.genres ? manga.genres.map(genre => genre.name) : [],
    authors: manga.authors ? manga.authors.map(author => author.name) : [],
    mal_id: manga.anilist_id,
    scored_by: manga.num_users_voted || 0,
  };

  // Prepare detail info items
  const detailItems = [
    ...(manga.chapters ? [{ icon: Book, label: 'Chapters', value: manga.chapters, bgColor: 'bg-primary/10' }] : []),
    ...(manga.volumes ? [{ icon: BookOpen, label: 'Volumes', value: manga.volumes, bgColor: 'bg-primary/10' }] : []),
    ...(manga.published_from ? [{ 
      icon: Calendar, 
      label: 'Published', 
      value: `${new Date(manga.published_from).toLocaleDateString('en-GB')}${manga.published_to ? ` to ${new Date(manga.published_to).toLocaleDateString('en-GB')}` : ''}`,
      bgColor: 'bg-secondary/10'
    }] : []),
    ...(manga.status ? [{ icon: FileText, label: 'Status', value: manga.status, bgColor: 'bg-accent/10' }] : []),
  ];

  return (
    <DetailPageLayout 
      backgroundImage={manga.image_url}
      colorTheme={manga.color_theme}
    >
      <div className="grid lg:grid-cols-5 gap-8">
        <DetailImageCard
          imageUrl={manga.image_url}
          title={getDisplayName(manga)}
          score={manga.score}
          rank={manga.rank}
          item={mangaForList}
          contentType="manga"
          shareData={{
            title: `${getDisplayName(manga)} - AniVault`,
            text: `Check out ${getDisplayName(manga)} on AniVault!`,
            url: window.location.href,
            image: manga.image_url
          }}
        />

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
            {manga.year && (
              <Badge variant="outline" className="px-4 py-2 text-base border-accent/30">
                {manga.year}
              </Badge>
            )}
            {manga.popularity && (
              <Badge variant="outline" className="px-4 py-2 text-base border-yellow-500/30 text-yellow-600">
                #{manga.popularity}
              </Badge>
            )}
          </div>

          {/* Stats Bar */}
        <DetailStatsBar
          score={manga.score}
          chapters={manga.chapters}
          volumes={manga.volumes}
          colorTheme={manga.color_theme}
          contentType="manga"
        />

          {/* Synopsis */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <RichSynopsis synopsis={manga.synopsis} />
          </div>

          {/* Details Grid */}
          {detailItems.length > 0 && (
            <DetailInfoGrid 
              items={detailItems}
              title="Information"
              animationDelay="0.5s"
            />
          )}

          {/* Genres */}
          {manga.genres && manga.genres.length > 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Genres</h3>
                <div className="flex flex-wrap gap-3">
                  {manga.genres.map((genre, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="px-4 py-2 text-base hover:bg-secondary/80 hover:scale-105 transition-all duration-200 cursor-pointer"
                      style={{ animationDelay: `${0.7 + (index * 0.05)}s` }}
                    >
                      {genre.name}
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
                      key={index} 
                      variant="outline" 
                      className="px-4 py-2 text-base border-primary/30 hover:bg-primary/10 hover:scale-105 transition-all duration-200 cursor-pointer"
                    >
                      {author.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score Validation Component */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <ScoreValidationComponent
              titleId={manga.id}
              anilistScore={manga.anilist_score}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </DetailPageLayout>
  );
};

export default MangaDetail;
