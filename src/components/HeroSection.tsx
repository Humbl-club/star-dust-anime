import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Zap } from "lucide-react";
import heroImage from "@/assets/anime-hero-bg.jpg";
import { useStats } from "@/hooks/useStats";

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

export const HeroSection = ({ onSearch }: HeroSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { stats, formatCount } = useStats();

  const handleSearch = () => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Anime Hero Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 z-10">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent rounded-full animate-float opacity-80" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-secondary rounded-full animate-float opacity-40" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-primary-glow rounded-full animate-float opacity-70" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-20 text-center max-w-5xl mx-auto mobile-safe-padding">
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
          {/* Title Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary animate-glow-pulse" />
              <Zap className="w-6 h-6 text-accent animate-bounce" />
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="text-accent">Ani</span>
              <span className="text-gradient-primary">thing</span>
            </h1>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground/90">
              Discover Everything Anime
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Track, discover, and explore your favorite anime and manga with the ultimate companion for every otaku journey.
          </p>

          {/* Search Section */}
            <div className="max-w-2xl mx-auto space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-primary rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
              <div className="relative flex gap-2 p-2 glass-card">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="Discover your next favorite anime or manga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 border-none bg-transparent text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none"
                  />
                </div>
                <Button 
                  variant="hero" 
                  size="default"
                  onClick={handleSearch}
                  className="px-8"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="accent" size="lg" className="w-full sm:w-auto px-8 py-4 text-lg touch-friendly hover-scale">
                Explore Trending
              </Button>
              <Button variant="glassmorphism" size="lg" className="w-full sm:w-auto px-8 py-4 text-lg touch-friendly hover-scale">
                My Collection
              </Button>
            </div>
          </div>

          {/* Stats Section - Mobile Optimized */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto pt-6 md:pt-8">
            <div className="text-center space-y-1 md:space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-gradient-primary">{formatCount(stats.animeCount)}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Anime Series</div>
            </div>
            <div className="text-center space-y-1 md:space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-accent">{formatCount(stats.mangaCount)}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Manga Titles</div>
            </div>
            <div className="text-center space-y-1 md:space-y-2">
              <div className="text-2xl md:text-3xl font-bold text-gradient-primary">{formatCount(stats.userCount)}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Community</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-15" />
    </section>
  );
};