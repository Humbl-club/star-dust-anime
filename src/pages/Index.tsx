
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import EmailConfirmation from "@/components/auth/EmailConfirmation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, PlayCircle, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleNewApiData } from "@/hooks/useSimpleNewApiData";
import { Navigation } from "@/components/Navigation";
import { type Anime, type Manga } from "@/data/animeData";

const ContentCard = ({ item, type }: { item: Anime | Manga; type: 'anime' | 'manga' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${type}/${item.id}`);
  };

  return (
    <Card 
      className="group hover-scale cursor-pointer touch-friendly"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={item.image_url} 
            alt={item.title}
            className="w-full h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Score Badge */}
          {item.score && (
            <Badge className="absolute top-2 right-2 glass-card border border-primary/20 glow-primary">
              <Star className="w-3 h-3 mr-1" />
              {item.score}
            </Badge>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-gradient-primary transition-colors">
            {item.title}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{(item as any).type}</span>
            {(item as any).status && (
              <>
                <span>•</span>
                <span className={
                  (item as any).status === 'Currently Airing' || (item as any).status === 'Publishing' ? 'text-green-400' :
                  (item as any).status === 'Finished Airing' || (item as any).status === 'Finished' ? 'text-blue-400' :
                  'text-yellow-400'
                }>
                  {(item as any).status}
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Check if this is an email confirmation callback
  const isEmailConfirmation = (
    // New Supabase format
    (searchParams.get('token_hash') && searchParams.get('type') === 'signup') ||
    // Custom format with our verification token
    (searchParams.get('token') && searchParams.get('type') === 'signup' && searchParams.get('email')) ||
    // Direct auth callback
    (searchParams.get('access_token') && searchParams.get('refresh_token'))
  );
  
  // If this is an email confirmation, show the confirmation component
  if (isEmailConfirmation) {
    return <EmailConfirmation />;
  }

  // Fetch featured content
  const { data: animeData, loading: animeLoading } = useSimpleNewApiData({ 
    contentType: 'anime',
    limit: 6,
    sort_by: 'score',
    order: 'desc'
  });

  const { data: mangaData, loading: mangaLoading } = useSimpleNewApiData({ 
    contentType: 'manga',
    limit: 6,
    sort_by: 'score',
    order: 'desc'
  });

  useEffect(() => {
    if (sessionStorage.getItem('justSignedUp') === 'true') {
      sessionStorage.removeItem('justSignedUp');
      alert('Welcome to Anithing! Please explore our platform.');
    }
  }, []);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gradient-primary">
            Discover Your Next Favorite
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Explore thousands of anime and manga titles
          </p>
          {!user && (
            <Button onClick={() => navigate('/auth')} size="lg" className="mb-8">
              Get Started
            </Button>
          )}
        </div>

        {/* Featured Anime Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <PlayCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Popular Anime</h2>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/anime')}
              className="flex items-center gap-2"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {animeLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-48 md:h-64 mb-2"></div>
                  <div className="bg-muted rounded h-4 w-full"></div>
                </div>
              ))
            ) : (
              animeData.slice(0, 6).map((anime) => (
                <ContentCard key={anime.id} item={anime} type="anime" />
              ))
            )}
          </div>
        </div>

        {/* Featured Manga Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Popular Manga</h2>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/manga')}
              className="flex items-center gap-2"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {mangaLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-48 md:h-64 mb-2"></div>
                  <div className="bg-muted rounded h-4 w-full"></div>
                </div>
              ))
            ) : (
              mangaData.slice(0, 6).map((manga) => (
                <ContentCard key={manga.id} item={manga} type="manga" />
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="cursor-pointer hover-scale" onClick={() => navigate('/anime')}>
            <CardHeader className="text-center">
              <PlayCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold">Browse Anime</h3>
              <p className="text-muted-foreground">Discover your next anime series</p>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover-scale" onClick={() => navigate('/manga')}>
            <CardHeader className="text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold">Browse Manga</h3>
              <p className="text-muted-foreground">Find amazing manga to read</p>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
