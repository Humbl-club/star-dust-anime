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
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Anime Hero Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background" />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 text-center max-w-5xl mx-auto mobile-safe-padding">
        <div className="space-y-6 md:space-y-8">
          {/* Title Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <Zap className="w-6 h-6 text-accent" />
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
          <div className="max-w-4xl mx-auto space-y-6 relative z-30">
            <div className="relative">
              <div className="glass-card border border-primary/30 p-3 hover:border-primary/50 transition-all duration-300">
                <WorkingSearchDropdown 
                  placeholder="Discover your next favorite anime or manga..." 
                  className="w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="default" 
                size="lg" 
                className="group w-full sm:w-auto px-8 py-4 text-lg touch-friendly transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Explore Trending
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="group w-full sm:w-auto px-8 py-4 text-lg touch-friendly transition-all duration-300 hover:scale-105"
              >
                <Zap className="w-5 h-5 mr-2" />
                My Collection
              </Button>
            </div>
          </div>

          {/* Stats Section */}
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
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent z-15" />
    </section>
  );
};