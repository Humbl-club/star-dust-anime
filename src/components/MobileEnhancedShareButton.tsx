import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Share2, Copy, ExternalLink } from 'lucide-react';
import { useNativeActions } from '@/hooks/useNativeActions';
import { cn } from '@/lib/utils';

interface MobileEnhancedShareButtonProps {
  title: string;
  url?: string;
  description?: string;
  className?: string;
}

export const MobileEnhancedShareButton = ({
  title,
  url = window.location.href,
  description,
  className,
}: MobileEnhancedShareButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { nativeShare, copyToClipboard, hapticFeedback, isNative } = useNativeActions();

  const handleNativeShare = async () => {
    await hapticFeedback('light');
    
    try {
      await nativeShare({
        title,
        text: description || `Check out ${title}`,
        url,
      });
      setIsOpen(false);
    } catch (error) {
      console.warn('Share failed:', error);
    }
  };

  const handleCopyLink = async () => {
    await hapticFeedback('light');
    await copyToClipboard(url);
    setIsOpen(false);
  };

  const handleOpenInBrowser = async () => {
    await hapticFeedback('light');
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("touch-manipulation", className)}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
        <SheetHeader className="text-left">
          <SheetTitle>Share {title}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4 py-4">
          {/* Native Share */}
          {isNative && (
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-left"
              onClick={handleNativeShare}
            >
              <Share2 className="w-5 h-5 mr-3 text-primary" />
              <div>
                <div className="font-medium">Share via App</div>
                <div className="text-xs text-muted-foreground">Use your device's share menu</div>
              </div>
            </Button>
          )}

          {/* Copy Link */}
          <Button
            variant="outline"
            className="w-full justify-start h-12 text-left"
            onClick={handleCopyLink}
          >
            <Copy className="w-5 h-5 mr-3 text-primary" />
            <div>
              <div className="font-medium">Copy Link</div>
              <div className="text-xs text-muted-foreground">Copy URL to clipboard</div>
            </div>
          </Button>

          {/* Open in Browser */}
          <Button
            variant="outline"
            className="w-full justify-start h-12 text-left"
            onClick={handleOpenInBrowser}
          >
            <ExternalLink className="w-5 h-5 mr-3 text-primary" />
            <div>
              <div className="font-medium">Open in Browser</div>
              <div className="text-xs text-muted-foreground">View in new tab</div>
            </div>
          </Button>


          {/* URL Display */}
          <div className="border rounded-lg p-3 bg-muted/50">
            <div className="text-xs font-medium text-muted-foreground mb-1">URL</div>
            <div className="text-sm font-mono break-all">{url}</div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};