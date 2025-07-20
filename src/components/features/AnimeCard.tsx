import { useState, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Play, BookOpen, Calendar, Flag, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddToListButton } from "./AddToListButton";
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
        className="anime-card cursor-pointer group relative h-[400px] hover-scale"
        onClick={handleCardClick}
      >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
      
      {/* Image Container */}
      <div className="relative h-full overflow-hidden">
        <img 
          src={anime.image_url} 
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Floating Status Badge */}
        <Badge 
          className="absolute top-3 right-3 z-20 glass-card border border-primary/20 glow-primary"
          variant="default"
        >
          {anime.status}
        </Badge>

        {/* Score Badge */}
        {anime.score && (
          <div className="absolute top-3 left-3 z-20 p-2 glass-card border border-yellow-400/20 rounded-full flex items-center gap-1" style={{boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)'}}>
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-semibold text-foreground">{anime.score}</span>
          </div>
        )}

        {/* Report Button */}
        <div className="absolute top-12 right-3 z-[9998] report-dropdown">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-background/90 border border-border hover:bg-background text-foreground z-[9999]"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <MoreVertical className="w-4 h-4" />
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
      
      {/* Content Overlay */}
      <CardContent className="absolute bottom-0 left-0 right-0 z-20 p-4">
        <div className="glass-card p-4 border border-border/20 space-y-2">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-gradient-primary transition-all duration-300">
            {displayName}
          </h3>
          
          {/* Simple info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{anime.year}</span>
            <span>•</span>
            <span>{anime.type}</span>
            {anime.episodes && (
              <>
                <span>•</span>
                <span>{anime.episodes} eps</span>
              </>
            )}
          </div>
          
          {/* Add to List Button */}
          <div className="mt-3">
            <AddToListButton 
              item={anime} 
              type="anime" 
              variant="outline" 
              size="sm"
              className="w-full glass-input border-primary/20 hover:border-primary/40 hover:bg-primary/10"
            />
          </div>

          {/* Trailer Preview - Subtle */}
          {(anime as any).trailer_id && (
            <div className="absolute -top-12 right-3 z-20">
              <TrailerPreview
                videoId={(anime as any).trailer_id}
                title={`${displayName} Trailer`}
                size="sm"
                className="w-8 h-8 glass-card border border-accent/20 opacity-70 hover:opacity-100 transition-opacity hover:glow-accent"
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