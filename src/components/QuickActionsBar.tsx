import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AddToListButton } from "@/components/AddToListButton";
import { ShareButton } from "@/components/ShareButton";
import { Plus, TrendingUp, Share, Star, ChevronDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsBarProps {
  item: any;
  contentType: 'anime' | 'manga';
  shareData: {
    title: string;
    text: string;
    url: string;
    image?: string;
  };
  className?: string;
}

export const QuickActionsBar = ({ 
  item, 
  contentType, 
  shareData, 
  className 
}: QuickActionsBarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show the bar after scrolling past the hero section (roughly 100px)
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRateClick = () => {
    scrollToSection('score-validation');
  };

  const handleProgressClick = () => {
    // This could be enhanced to show a progress modal
    console.log('Track progress clicked');
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "sticky top-16 z-30 transition-all duration-300",
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
      className
    )}>
      {/* Mobile Layout - Expandable */}
      <div className="md:hidden">
        <div className="bg-background/95 backdrop-blur-md border-y border-border shadow-lg">
          {/* Collapsed State */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <AddToListButton
                  item={item}
                  type={contentType}
                  variant="default"
                  size="sm"
                  className="flex-1"
                />
                <ShareButton
                  shareData={shareData}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  showLabel
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-2"
              >
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </Button>
            </div>

            {/* Expanded State */}
            {isExpanded && (
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProgressClick}
                  className="flex items-center justify-center"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Progress
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRateClick}
                  className="flex items-center justify-center"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Rate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('comments')}
                  className="flex items-center justify-center"
                >
                  Comments
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollToTop}
                  className="flex items-center justify-center"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Top
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout - Horizontal */}
      <div className="hidden md:block">
        <div className="bg-background/95 backdrop-blur-md border-y border-border shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AddToListButton
                  item={item}
                  type={contentType}
                  variant="default"
                  className="gap-2"
                />
                
                <Button
                  variant="outline"
                  onClick={handleProgressClick}
                  className="gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Track Progress
                </Button>
                
                <ShareButton
                  shareData={shareData}
                  variant="outline"
                  className="gap-2"
                  showLabel
                />
                
                <Button
                  variant="outline"
                  onClick={handleRateClick}
                  className="gap-2"
                >
                  <Star className="w-4 h-4" />
                  Rate
                </Button>
              </div>

              {/* Quick Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('details')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('comments')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Comments
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollToTop}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};