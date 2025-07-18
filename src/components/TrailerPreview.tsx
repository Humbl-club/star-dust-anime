import { useState } from "react";
import { Play, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { youtubeService } from "@/services/youtube";

interface TrailerPreviewProps {
  videoId: string;
  title: string;
  thumbnail?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TrailerPreview = ({ 
  videoId, 
  title, 
  thumbnail, 
  className = "",
  size = 'md' 
}: TrailerPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!youtubeService.isValidVideoId(videoId)) {
    return null;
  }

  const thumbnailUrl = thumbnail || youtubeService.getThumbnail(videoId, 'high');
  const embedUrl = youtubeService.getEmbedUrl(videoId);
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-48 h-28", 
    lg: "w-64 h-36"
  };

  const handlePlay = () => {
    setIsLoading(true);
    setIsOpen(true);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <>
      <div className={`relative group cursor-pointer ${sizeClasses[size]} ${className}`}>
        <div 
          className="relative w-full h-full rounded-lg overflow-hidden bg-muted"
          onClick={handlePlay}
        >
          <img
            src={thumbnailUrl}
            alt={`${title} trailer`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/60 transition-colors">
            <div className="bg-red-600/90 rounded-full p-1 group-hover:bg-red-600 transition-colors">
              <Play className="w-3 h-3 text-white fill-current" />
            </div>
          </div>
        </div>

      </div>

      {/* Video Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold truncate pr-4">{title}</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(youtubeUrl, '_blank')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video bg-black">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>
              )}
              
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleIframeLoad}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};