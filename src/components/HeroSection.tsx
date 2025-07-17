import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Zap } from "lucide-react";
import { WorkingSearchDropdown } from "@/components/WorkingSearchDropdown";
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
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden pt-16 md:pt-20">
      {/* Enhanced Background Image with Parallax Effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 animate-background-pan">
          <img 
            src={heroImage} 
            alt="Anime Hero Background"
            className="w-full h-full object-cover scale-110 animate-gradient-shift"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background animate-gradient-shift" />
        <div className="absolute inset-0 bg-gradient-hero animate-pulse-glow" />
        
        {/* Animated gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-secondary/10 animate-gradient-shift" />
      </div>

      {/* Enhanced Animated Particles */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {/* Large floating particles */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full animate-particle-float opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-accent rounded-full animate-particle-float opacity-80" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-secondary rounded-full animate-particle-float opacity-40" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 right-1/4 w-2.5 h-2.5 bg-primary-glow rounded-full animate-particle-float opacity-70" style={{ animationDelay: '0.5s' }} />
        
        {/* Small floating particles */}
        <div className="absolute top-1/5 left-1/5 w-1 h-1 bg-primary rounded-full animate-float opacity-50" style={{ animationDelay: '3s' }} />
        <div className="absolute top-3/4 left-2/3 w-1.5 h-1.5 bg-accent rounded-full animate-float opacity-60" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-1/3 right-1/5 w-1 h-1 bg-secondary rounded-full animate-float opacity-40" style={{ animationDelay: '2.5s' }} />
        
        {/* Rotating background elements */}
        <div className="absolute top-1/6 right-1/6 w-8 h-8 border border-primary/20 rounded-full animate-rotate-slow" />
        <div className="absolute bottom-1/6 left-1/6 w-6 h-6 border border-accent/20 rounded-full animate-rotate-slow" style={{ animationDelay: '10s' }} />
        
        {/* Gradient orbs */}
        <div className="absolute top-1/2 left-1/8 w-20 h-20 bg-gradient-primary rounded-full opacity-20 animate-pulse-glow blur-xl" />
        <div className="absolute bottom-1/3 right-1/8 w-16 h-16 bg-gradient-secondary rounded-full opacity-15 animate-pulse-glow blur-xl" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-20 text-center max-w-5xl mx-auto mobile-safe-padding">
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
          {/* Title Section */}
          <div className="space-y-4 animate-bounce-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary animate-pulse-glow" />
              <Zap className="w-6 h-6 text-accent animate-bounce-subtle" />
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-slide-up-fade">
              <span className="text-accent animate-pulse-glow">Ani</span>
              <span className="text-gradient-primary animate-gradient-shift">thing</span>
            </h1>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground/90 animate-scale-in">
              Discover Everything Anime
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Track, discover, and explore your favorite anime and manga with the ultimate companion for every otaku journey.
          </p>

          {/* Enhanced Search Section */}
          <div className="max-w-4xl mx-auto space-y-6 relative z-30 animate-bounce-in" style={{ animationDelay: '0.5s' }}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500 animate-pulse-glow" />
              <div className="absolute inset-0 bg-gradient-secondary rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-all duration-700 animate-pulse-glow" style={{ animationDelay: '0.2s' }} />
              <div className="relative glass-card border border-primary/30 p-3 hover:border-primary/50 transition-all duration-300 shadow-glow-primary/20 hover:shadow-glow-primary/40">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
                <WorkingSearchDropdown 
                  placeholder="Discover your next favorite anime or manga..." 
                  className="w-full relative z-10"
                />
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up-fade" style={{ animationDelay: '0.7s' }}>
              <Button 
                variant="default" 
                size="lg" 
                className="group w-full sm:w-auto px-8 py-4 text-lg touch-friendly bg-gradient-primary border-none shadow-glow-primary hover:shadow-glow-primary/60 transition-all duration-300 animate-pulse-glow hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2 group-hover:animate-bounce-subtle" />
                Explore Trending
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="group w-full sm:w-auto px-8 py-4 text-lg touch-friendly glass-button hover:bg-gradient-secondary/20 transition-all duration-300 hover:scale-105"
              >
                <Zap className="w-5 h-5 mr-2 group-hover:animate-bounce-subtle" />
                My Collection
              </Button>
            </div>
          </div>

          {/* Enhanced Stats Section */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto pt-6 md:pt-8 animate-slide-up-fade" style={{ animationDelay: '0.9s' }}>
            <div className="text-center space-y-1 md:space-y-2 group hover:scale-105 transition-transform duration-300">
              <div className="text-2xl md:text-3xl font-bold text-gradient-primary animate-pulse-glow group-hover:animate-bounce-subtle">{formatCount(stats.animeCount)}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Anime Series</div>
            </div>
            <div className="text-center space-y-1 md:space-y-2 group hover:scale-105 transition-transform duration-300">
              <div className="text-2xl md:text-3xl font-bold text-accent animate-pulse-glow group-hover:animate-bounce-subtle">{formatCount(stats.mangaCount)}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Manga Titles</div>
            </div>
            <div className="text-center space-y-1 md:space-y-2 group hover:scale-105 transition-transform duration-300">
              <div className="text-2xl md:text-3xl font-bold text-gradient-primary animate-pulse-glow group-hover:animate-bounce-subtle">{formatCount(stats.userCount)}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Community</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent z-15 animate-gradient-shift" />
      
      {/* Additional floating elements for depth */}
      <div className="absolute inset-0 z-5 opacity-30">
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-primary rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-secondary rounded-full blur-2xl animate-float-delayed" style={{ animationDelay: '2s' }} />
      </div>
    </section>
  );
};