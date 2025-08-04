
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, Award, Play, Zap, ExternalLink, Search } from "lucide-react";
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
import { SmartTrailerSection } from "@/components/SmartTrailerSection";
import { OfflineFallback } from "@/components/OfflineFallback";
import { usePWA } from "@/hooks/usePWA";
import { offlineStorage } from "@/lib/cache/offlineStorage";
import { SimilarTitles } from "@/components/SimilarTitles";
import { StreamingLinks } from "@/components/StreamingLinks";
import { 
  SiCrunchyroll, 
  SiNetflix, 
  SiAmazonprime,
  SiFunimation,
  SiApple
} from 'react-icons/si';
import { FaTv, FaPlay } from 'react-icons/fa';
import { RiNetflixFill } from 'react-icons/ri';

// Enhanced Legal Streaming Links Component
const LegalStreamingLinks = ({ anime }: { anime: any }) => {
  const navigate = useNavigate();
  // Check if external_links data exists (from AniList API)
  const externalLinks = anime.external_links || [];
  
  // If we have external links data, use the StreamingLinks component
  if (externalLinks.length > 0) {
    return (
      <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <StreamingLinks 
          externalLinks={externalLinks} 
          colorTheme={anime.color_theme}
        />
      </div>
    );
  }

  // Enhanced fallback: Create search links for popular streaming platforms
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Crunchyroll':
        return <SiCrunchyroll className="w-5 h-5" style={{ color: '#FF6600' }} />;
      case 'Netflix':
        return <SiNetflix className="w-5 h-5" style={{ color: '#E50914' }} />;
      case 'Hulu':
        return <FaTv className="w-5 h-5" style={{ color: '#1CE783' }} />;
      case 'Amazon Prime Video':
        return <SiAmazonprime className="w-5 h-5" style={{ color: '#00A8E1' }} />;
      case 'Funimation':
        return <SiFunimation className="w-5 h-5" style={{ color: '#5B4FFF' }} />;
      case 'Apple TV':
        return <SiApple className="w-5 h-5" style={{ color: '#555555' }} />;
      case 'Disney Plus':
        return <FaTv className="w-5 h-5" style={{ color: '#113CCF' }} />;
      default:
        return <FaTv className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const fallbackStreamingLinks = [
    { 
      id: 1, 
      url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`, 
      site: 'Crunchyroll', 
      type: 'STREAMING',
      color: '#FF6600'
    },
    { 
      id: 2, 
      url: `https://www.netflix.com/search?q=${encodeURIComponent(anime.title)}`, 
      site: 'Netflix', 
      type: 'STREAMING',
      color: '#E50914'
    },
    { 
      id: 3, 
      url: `https://www.hulu.com/search?q=${encodeURIComponent(anime.title)}`, 
      site: 'Hulu', 
      type: 'STREAMING',
      color: '#1CE783'
    },
    { 
      id: 4, 
      url: `https://www.amazon.com/s?k=${encodeURIComponent(anime.title + ' anime')}`, 
      site: 'Amazon Prime Video', 
      type: 'STREAMING',
      color: '#00A8E1'
    },
    { 
      id: 5, 
      url: `https://www.funimation.com/search/?q=${encodeURIComponent(anime.title)}`, 
      site: 'Funimation', 
      type: 'STREAMING',
      color: '#5B4FFF'
    },
    { 
      id: 6, 
      url: `https://tv.apple.com/search?term=${encodeURIComponent(anime.title)}`, 
      site: 'Apple TV', 
      type: 'STREAMING',
      color: '#555555'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaPlay className="w-6 h-6 text-primary" />
            Search on Streaming Platforms
          </h3>
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-amber-200/20">
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
              <ExternalLink className="w-4 h-4" />
              No direct streaming links available. Search for "{anime.title}" on these platforms:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/streaming-search?q=${encodeURIComponent(anime.title)}`)}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Advanced Streaming Platform Search
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fallbackStreamingLinks.map((service, index) => (
              <Button
                key={service.id}
                variant="outline"
                size="sm"
                asChild
                className="h-auto p-4 justify-start hover:scale-[1.02] transition-all duration-200 animate-fade-in group"
                style={{ 
                  animationDelay: `${0.1 + (index * 0.05)}s`,
                  borderColor: service.color ? `${service.color}40` : undefined
                }}
              >
                <a href={service.url} target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-3 w-full">
                    {getPlatformIcon(service.site)}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{service.site}</div>
                      <div className="text-xs text-muted-foreground">Search Platform</div>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              </Button>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Support the creators by watching on official platforms
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
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
        <div className="space-y-6">
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
          
          {/* Smart Trailer Section underneath the image */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <SmartTrailerSection
              animeTitle={anime.title}
              className="w-full"
            />
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
