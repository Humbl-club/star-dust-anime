
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Award, 
  Share2, 
  Bookmark, 
  ExternalLink 
} from 'lucide-react';
import { AddToListButton } from '@/components/features/AddToListButton';
import { ShareButton } from '@/components/ShareButton';
import { EnhancedTrailerPlayer } from '@/components/EnhancedTrailerPlayer';

interface DetailImageCardProps {
  imageUrl: string;
  title: string;
  score?: number;
  anilistScore?: number;
  rank?: number;
  trailer?: {
    id: string;
    site: string;
    thumbnail: string;
  };
  item: any; // For AddToListButton
  contentType: 'anime' | 'manga';
  shareData?: {
    title: string;
    text: string;
    url: string;
    image: string;
  };
}

export const DetailImageCard = ({
  imageUrl,
  title,
  score,
  anilistScore,
  rank,
  trailer,
  item,
  contentType,
  shareData
}: DetailImageCardProps) => {
  const displayScore = anilistScore || score;

  return (
    <div className="lg:col-span-2">
      <div className="sticky top-8">
        <Card className="overflow-hidden border-border/50 bg-card/90 backdrop-blur-sm shadow-2xl animate-scale-in">
          <div className="aspect-[3/4] relative group">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Floating Score Badge */}
            {displayScore && (
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-full p-3 flex items-center gap-2 shadow-lg">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-white font-bold text-lg">
                  {displayScore}
                </span>
              </div>
            )}
            
            {/* Rank Badge */}
            {rank && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-2 flex items-center gap-1 shadow-lg">
                <Award className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">#{rank}</span>
              </div>
            )}
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                {shareData && (
                  <ShareButton
                    shareData={shareData}
                    variant="ghost"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  />
                )}
                <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Action Buttons */}
        <div className="mt-6 space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <AddToListButton 
            item={item} 
            type={contentType} 
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg"
          />
          
          {trailer && (
            <div className="w-full">
              <EnhancedTrailerPlayer
                videoId={trailer.id}
                title={title}
                className="w-full"
              />
            </div>
          )}
          
          <Button variant="outline" className="w-full border-secondary/30 hover:bg-secondary/10">
            <ExternalLink className="w-4 h-4 mr-2" />
            View on MyAnimeList
          </Button>
        </div>
      </div>
    </div>
  );
};
