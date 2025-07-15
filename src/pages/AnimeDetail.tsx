
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, Award, Play, Zap } from "lucide-react";
import { useNamePreference } from "@/hooks/useNamePreference";
import { ScoreValidationComponent } from "@/components/ScoreValidationComponent";
import { AnimeMetaTags } from "@/components/SEOMetaTags";
import { RichSynopsis } from "@/components/RichSynopsis";
import { useAnimeDetail } from "@/hooks/useAnimeDetail";
import { DetailPageLayout } from "@/components/DetailPageLayout";
import { DetailStatsBar } from "@/components/DetailStatsBar";
import { DetailImageCard } from "@/components/DetailImageCard";
import { DetailInfoGrid } from "@/components/DetailInfoGrid";
import { EnhancedRatingComponent } from "@/components/EnhancedRatingComponent";

const AnimeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDisplayName } = useNamePreference();
  
  const { anime, loading, error } = useAnimeDetail(id || '');

  const enhancedAnime = anime ? {
    ...anime,
    image_url: anime.image_url,
    color_theme: anime.color_theme,
    trailer: anime.trailer_id ? {
      id: anime.trailer_id,
      site: anime.trailer_site || 'YouTube',
      thumbnail: `https://img.youtube.com/vi/${anime.trailer_id}/maxresdefault.jpg`
    } : null,
  } : null;

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

  if (error || !anime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {error || 'Anime not found'}
          </h2>
          <Button onClick={() => navigate('/anime')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Anime List
          </Button>
        </div>
      </div>
    );
  }

  // Create a compatible anime object for AddToListButton
  const animeForList = {
    ...anime,
    synopsis: anime.synopsis || '',
    image_url: anime.image_url || '',
    genres: anime.genres ? anime.genres.map(genre => genre.name) : [],
    studios: anime.studios ? anime.studios.map(studio => studio.name) : [],
    mal_id: anime.anilist_id,
    scored_by: anime.members || 0,
  };

  // Prepare detail info items
  const detailItems = [
    ...(anime.episodes ? [{ icon: Play, label: 'Episodes', value: anime.episodes, bgColor: 'bg-primary/10' }] : []),
    ...(anime.aired_from ? [{ 
      icon: Calendar, 
      label: 'Aired', 
      value: `${new Date(anime.aired_from).toLocaleDateString('en-GB')}${anime.aired_to ? ` to ${new Date(anime.aired_to).toLocaleDateString('en-GB')}` : ''}`,
      bgColor: 'bg-secondary/10'
    }] : []),
    ...(anime.season ? [{ icon: Clock, label: 'Season', value: anime.season, bgColor: 'bg-accent/10' }] : []),
    ...(anime.rank ? [{ icon: Award, label: 'Rank', value: `#${anime.rank}`, bgColor: 'bg-yellow-500/10' }] : []),
  ];

  return (
    <DetailPageLayout 
      backgroundImage={anime.image_url}
      colorTheme={enhancedAnime?.color_theme}
      seoComponent={<AnimeMetaTags anime={anime} />}
    >
      <div className="grid lg:grid-cols-5 gap-8">
        <DetailImageCard
          imageUrl={anime.image_url}
          title={getDisplayName(anime)}
          score={anime.score}
          anilistScore={enhancedAnime?.anilist_score}
          rank={anime.rank}
          trailer={enhancedAnime?.trailer}
          item={animeForList}
          contentType="anime"
          shareData={{
            title: `${getDisplayName(anime)} - AniVault`,
            text: `Check out ${getDisplayName(anime)} on AniVault!`,
            url: window.location.href,
            image: enhancedAnime?.image_url || anime.image_url
          }}
        />

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
                #{anime.popularity}
              </Badge>
            )}
          </div>

          {/* Stats Bar */}
          <DetailStatsBar
            score={anime.score}
            anilistScore={enhancedAnime?.anilist_score}
            episodes={anime.episodes}
            colorTheme={enhancedAnime?.color_theme}
            contentType="anime"
          />

          {/* Synopsis */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <RichSynopsis 
              synopsis={anime.synopsis}
              allowMarkdown={true}
              maxLength={600}
            />
          </div>

          {/* Details Grid */}
          {detailItems.length > 0 && (
            <DetailInfoGrid 
              items={detailItems}
              title="Details"
              animationDelay="0.5s"
            />
          )}

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
                      {genre.name}
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
                      {studio.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Rating Component */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <EnhancedRatingComponent
              contentId={anime.id}
              contentType="anime"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </DetailPageLayout>
  );
};

export default AnimeDetail;
