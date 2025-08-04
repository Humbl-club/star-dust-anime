
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, Award, Play, Zap, ExternalLink } from "lucide-react";
import { useNamePreference } from "@/hooks/useNamePreference";
import { ScoreValidationComponent } from "@/components/ScoreValidationComponent";
import { CommentsSection } from "@/components/CommentsSection";
import { AnimeMetaTags } from "@/components/SEOMetaTags";
import { RichSynopsis } from "@/components/RichSynopsis";
import { useAnimeDetail } from "@/hooks/useAnimeDetail";
import { DetailPageLayout } from "@/components/layouts/DetailPageLayout";
import { DetailStatsBar } from "@/components/DetailStatsBar";
import { DetailImageCard } from "@/components/DetailImageCard";
import { DetailInfoGrid } from "@/components/DetailInfoGrid";
import { OfflineFallback } from "@/components/OfflineFallback";
import { usePWA } from "@/hooks/usePWA";
import { offlineStorage } from "@/lib/cache/offlineStorage";
import { SimilarTitles } from "@/components/SimilarTitles";


// Legal Streaming Links Component
const LegalStreamingLinks = ({ anime }: { anime: any }) => {
  const streamingServices = [
    { name: 'Crunchyroll', url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`, icon: '🟠' },
    { name: 'Funimation', url: `https://www.funimation.com/search/?q=${encodeURIComponent(anime.title)}`, icon: '🟣' },
    { name: 'Netflix', url: `https://www.netflix.com/search?q=${encodeURIComponent(anime.title)}`, icon: '🔴' },
    { name: 'Hulu', url: `https://www.hulu.com/search?q=${encodeURIComponent(anime.title)}`, icon: '🟢' },
    { name: 'Amazon Prime', url: `https://www.amazon.com/s?k=${encodeURIComponent(anime.title)}`, icon: '🔵' }
  ];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in" style={{ animationDelay: '0.8s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <Play className="w-6 h-6 text-primary" />
          Watch Legally
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          Support the creators by watching on official platforms:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {streamingServices.map((service) => (
            <a
              key={service.name}
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-border/50 hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 hover:scale-105 group"
            >
              <span className="text-2xl">{service.icon}</span>
              <div className="flex-1">
                <span className="text-sm font-medium block">{service.name}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const AnimeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDisplayName } = useNamePreference();
  const { isOnline } = usePWA();
  
  // Add debugging logs
  console.log('Detail page ID:', id);
  console.log('ID type:', typeof id);
  
  const { anime, loading, error } = useAnimeDetail(id || '');
  
  // Cache content when successfully loaded
  useEffect(() => {
    if (anime && !loading && !error) {
      offlineStorage.cacheAnime({
        id: anime.id,
        title: anime.title,
        title_english: anime.title_english,
        title_japanese: anime.title_japanese,
        image_url: anime.image_url,
        synopsis: anime.synopsis,
        score: anime.score,
        episodes: anime.episodes,
        status: anime.status,
        aired_from: anime.aired_from,
        aired_to: anime.aired_to,
        genres: anime.genres?.map(g => g.name) || [],
        studios: anime.studios?.map(s => s.name) || [],
        cachedAt: Date.now(),
        type: 'anime'
      });
      
      // Add to recently viewed
      offlineStorage.addRecentlyViewed({
        id: anime.id,
        title: anime.title,
        title_english: anime.title_english,
        title_japanese: anime.title_japanese,
        image_url: anime.image_url,
        synopsis: anime.synopsis,
        score: anime.score,
        episodes: anime.episodes,
        status: anime.status,
        aired_from: anime.aired_from,
        aired_to: anime.aired_to,
        genres: anime.genres?.map(g => g.name) || [],
        studios: anime.studios?.map(s => s.name) || [],
        cachedAt: Date.now(),
        type: 'anime'
      });
    }
  }, [anime, loading, error]);
  
  // Debug the fetch result
  console.log('Fetch result:', { anime, loading, error });
  
  // Add test query to check database directly
  useEffect(() => {
    const testQuery = async () => {
      if (!id) return;
      
      console.log('🧪 Testing direct database queries...');
      
      // Test if we can fetch any anime
      const { data: testData, error: testError } = await supabase
        .from('titles')
        .select('*, anime_details!inner(*)')
        .limit(1);
      
      console.log('Test query result:', { testData, testError });
      
      // Test with the current ID as UUID
      const { data: uuidData, error: uuidError } = await supabase
        .from('titles')
        .select('*, anime_details!inner(*)')
        .eq('id', id)
        .maybeSingle();
        
      console.log('UUID query result:', { uuidData, uuidError, id });
      
      // Test with the current ID as anilist_id (if it's numeric)
      if (id && /^\d+$/.test(id)) {
        const { data: anilistData, error: anilistError } = await supabase
          .from('titles')
          .select('*, anime_details!inner(*)')
          .eq('anilist_id', parseInt(id))
          .maybeSingle();
          
        console.log('AniList ID query result:', { anilistData, anilistError, anilistId: parseInt(id) });
      }
    };
    
    testQuery();
  }, [id]);

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

  if (error) {
    // If offline and there's an error, try to show cached content
    if (!isOnline) {
      return <OfflineFallback type="anime" onRetry={() => window.location.reload()} />;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Anime</h2>
          <p className="text-muted-foreground">{error}</p>
          <pre className="mt-4 p-4 bg-gray-100 rounded text-left text-sm max-w-lg">
            {JSON.stringify({ error, id, idType: typeof id }, null, 2)}
          </pre>
          <Button onClick={() => navigate('/anime')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Anime List
          </Button>
        </div>
      </div>
    );
  }

  if (!loading && !anime) {
    // If offline and no cached content, show offline fallback
    if (!isOnline) {
      return <OfflineFallback type="anime" onRetry={() => window.location.reload()} />;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Anime Not Found</h2>
          <p className="text-muted-foreground">ID: {id}</p>
          <p className="text-sm text-muted-foreground">Type: {typeof id}</p>
          <Button onClick={() => window.history.back()} className="mt-4 mr-2">
            Go Back
          </Button>
          <Button onClick={() => navigate('/anime')} variant="outline" className="mt-4">
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
    scored_by: anime.num_users_voted || 0,
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
            <div id="details">
              <DetailInfoGrid 
                items={detailItems}
                title="Details"
                animationDelay="0.5s"
              />
            </div>
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

          {/* Legal Streaming Links */}
          <LegalStreamingLinks anime={anime} />

          {/* Score Validation Component */}
          <div id="score-validation" className="mb-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <ScoreValidationComponent
              titleId={anime.id}
              anilistScore={anime.anilist_score}
              className="w-full"
            />
          </div>

          {/* Comments Section */}
          <div id="comments" className="animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <CommentsSection titleId={anime.id} />
          </div>
        </div>
      </div>

      {/* Similar Titles Section */}
      <div className="mt-12 animate-fade-in" style={{ animationDelay: '1.0s' }}>
        <SimilarTitles 
          titleId={anime.id} 
          contentType="anime" 
          currentTitle={getDisplayName(anime)}
        />
      </div>
    </DetailPageLayout>
  );
};

export default AnimeDetail;
