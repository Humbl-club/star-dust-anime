import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Share2, 
  Copy, 
  Twitter, 
  Facebook, 
  MessageCircle,
  Send,
  Linkedin,
  QrCode,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { deepLinkingService, ShareData } from "@/services/deepLinking";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShareButtonProps {
  shareData: ShareData;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export const ShareButton = ({ 
  shareData, 
  variant = "ghost", 
  size = "sm",
  className = "",
  showLabel = false
}: ShareButtonProps) => {
  const [qrCodeOpen, setQrCodeOpen] = useState(false);

  const handleNativeShare = async () => {
    const success = await deepLinkingService.nativeShare(shareData);
    if (success) {
      toast.success("Shared successfully!");
      deepLinkingService.trackLinkClick('native_share', shareData.url);
    } else {
      // Fallback to copy to clipboard
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const success = await deepLinkingService.copyToClipboard(shareData.url);
    if (success) {
      toast.success("Link copied to clipboard!");
      deepLinkingService.trackLinkClick('copy_link', shareData.url);
    } else {
      toast.error("Failed to copy link");
    }
  };

  const handleSocialShare = (platform: string, url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    deepLinkingService.trackLinkClick('social_share', shareData.url, platform);
    toast.success(`Shared to ${platform}!`);
  };

  const socialLinks = deepLinkingService.generateSocialShareLinks(shareData);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Share2 className="w-4 h-4" />
            {showLabel && <span className="ml-2">Share</span>}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Share this content</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Native share (if supported) */}
          {navigator.share && (
            <>
              <DropdownMenuItem onClick={handleNativeShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share via device
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Copy link */}
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy link
          </DropdownMenuItem>

          {/* QR Code */}
          <DropdownMenuItem onClick={() => setQrCodeOpen(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            Show QR code
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Social media</DropdownMenuLabel>
          
          {/* Social media options */}
          <DropdownMenuItem onClick={() => handleSocialShare('Twitter', socialLinks.twitter)}>
            <Twitter className="w-4 h-4 mr-2" />
            Twitter
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('Facebook', socialLinks.facebook)}>
            <Facebook className="w-4 h-4 mr-2" />
            Facebook
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('LinkedIn', socialLinks.linkedin)}>
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Messaging</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => handleSocialShare('WhatsApp', socialLinks.whatsapp)}>
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('Telegram', socialLinks.telegram)}>
            <Send className="w-4 h-4 mr-2" />
            Telegram
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('Discord', socialLinks.discord)}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Discord
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleSocialShare('Reddit', socialLinks.reddit)}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Reddit
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('Pinterest', socialLinks.pinterest)}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Pinterest
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeOpen} onOpenChange={setQrCodeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share via QR Code</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-lg">
              <img
                src={deepLinkingService.generateQRCodeUrl(shareData.url, 200)}
                alt="QR Code"
                className="w-48 h-48"
                loading="lazy"
              />
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code to open the link on another device
            </p>
            
            <Button onClick={handleCopyLink} variant="outline" className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Copy Link Instead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};