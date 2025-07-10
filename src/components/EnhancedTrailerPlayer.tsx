import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink } from "lucide-react";
import { useState } from "react";

interface EnhancedTrailerPlayerProps {
  videoId?: string;
  title: string;
  trailerUrl?: string;
  className?: string;
}

export const EnhancedTrailerPlayer = ({ 
  videoId, 
  title, 
  trailerUrl,
  className = ""
}: EnhancedTrailerPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const url = trailerUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : null);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : null;

  if (!url) return null;

  return (
    <Card className={`overflow-hidden group ${className}`}>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          {isPlaying && embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${title} Trailer`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img
                src={videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : ''}
                alt={`${title} Trailer Thumbnail`}
                className="w-full h-full object-cover"
              />
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={() => setIsPlaying(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-20 h-20 rounded-full backdrop-blur-sm"
                >
                  <Play className="w-8 h-8 ml-1" />
                </Button>
              </div>
            </>
          )}
          
          {/* Top controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-white text-sm font-medium">{title} Trailer</span>
            </div>
            
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(url, '_blank')}
              className="bg-black/60 hover:bg-black/80 text-white border-white/30"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};