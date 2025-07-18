import { useState, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Play, BookOpen, Calendar, Flag, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddToListButton } from "@/components/AddToListButton";
import { ContentReportModal } from "@/components/ContentReportModal";
import { TrailerPreview } from "@/components/TrailerPreview";
import { type Anime } from "@/data/animeData";

interface AnimeCardProps {
  anime: Anime;
  onClick?: () => void;
  showCountdown?: boolean;
  getDisplayName?: (anime: Anime) => string;
}

export const AnimeCard = memo(({ 
  anime,
  onClick,
  showCountdown = true,
  getDisplayName
}: AnimeCardProps) => {
  const [showReportModal, setShowReportModal] = useState(false);

  const displayName = getDisplayName ? getDisplayName(anime) : anime.title;

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger card click if clicking on the dropdown or report button
    if ((e.target as HTMLElement).closest('.report-dropdown')) {
      return;
    }
    onClick?.();
  }, [onClick]);

  const handleReportClick = useCallback(() => {
    setShowReportModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowReportModal(false);
  }, []);

  return (
    <>
      <Card 
        className="anime-card cursor-pointer group relative h-[320px] sm:h-[400px] hover-scale touch-spring"
        onClick={handleCardClick}
      >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
      
      {/* Image Container */}
      <div className="relative h-full overflow-hidden">
        <img 
          src={anime.image_url} 
          alt={displayName}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Mobile-optimized Status Badge */}
        <Badge 
          className="absolute top-2 right-2 z-20 glass-card border border-primary/20 glow-primary text-xs px-2 py-1"
          variant="default"
        >
          {anime.status}
        </Badge>

        {/* Mobile-optimized Score Badge */}
        {anime.score && (
          <div className="absolute top-2 left-2 z-20 p-1.5 glass-card border border-yellow-400/20 rounded-full flex items-center gap-1" style={{boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)'}}>
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-semibold text-foreground">{anime.score}</span>
          </div>
        )}

        {/* Mobile-optimized Report Button */}
        <div className="absolute top-10 right-2 z-[9998] report-dropdown">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-background/90 border border-border hover:bg-background text-foreground z-[9999] touch-friendly"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="bottom" 
              align="end" 
              className="z-[9999] bg-background border border-border shadow-lg min-w-[140px]"
              sideOffset={4}
              avoidCollisions={true}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleReportClick();
                }} 
                className="hover:bg-accent cursor-pointer"
              >
                <Flag className="w-4 h-4 mr-2" />
                Report Content
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile-optimized Content Overlay */}
      <CardContent className="absolute bottom-0 left-0 right-0 z-20 p-3">
        <div className="glass-card p-3 border border-border/20 space-y-2">
          <h3 className="font-bold text-sm sm:text-lg line-clamp-2 group-hover:text-gradient-primary transition-all duration-300">
            {displayName}
          </h3>
          
          {/* Mobile-optimized info */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
            <span className="truncate">{anime.year}</span>
            <span>•</span>
            <span className="truncate">{anime.type}</span>
            {anime.episodes && (
              <>
                <span>•</span>
                <span className="truncate">{anime.episodes}ep</span>
              </>
            )}
          </div>
          
          {/* Mobile-optimized Add to List Button */}
          <div className="mt-2">
            <AddToListButton 
              item={anime} 
              type="anime" 
              variant="outline" 
              size="sm"
              className="w-full glass-input border-primary/20 hover:border-primary/40 hover:bg-primary/10 text-xs py-2 touch-friendly"
            />
          </div>

          {/* Mobile-optimized Trailer Preview */}
          {'trailer_id' in anime && anime.trailer_id && (
            <div className="absolute -top-10 right-2 z-20">
              <TrailerPreview
                videoId={'trailer_id' in anime ? anime.trailer_id : undefined}
                title={`${displayName} Trailer`}
                size="sm"
                className="w-7 h-7 glass-card border border-accent/20 opacity-70 hover:opacity-100 transition-opacity hover:glow-accent touch-friendly"
              />
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-15" />
      
    </Card>

      {/* Report Modal */}
      <ContentReportModal
        isOpen={showReportModal}
        onClose={handleCloseModal}
        contentType="anime"
        contentId={anime.id}
        contentTitle={displayName}
      />
    </>
  );
});