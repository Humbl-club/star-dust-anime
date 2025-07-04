import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/ShareButton";
import { deepLinkingService } from "@/services/deepLinking";
import { toast } from "sonner";
import { Link2, ExternalLink, TestTube, Zap } from "lucide-react";

export const DeepLinkTestComponent = () => {
  const [testAnimeId, setTestAnimeId] = useState("1");
  const [testMangaId, setTestMangaId] = useState("1");
  const [testQuery, setTestQuery] = useState("naruto");

  const generateTestLinks = () => {
    const animeLink = deepLinkingService.generateAnimeLink(testAnimeId, {
      trackingParams: { utm_source: 'test', utm_campaign: 'deep_linking' }
    });
    
    const mangaLink = deepLinkingService.generateMangaLink(testMangaId, {
      trackingParams: { utm_source: 'test', utm_campaign: 'deep_linking' }
    });
    
    const searchLink = deepLinkingService.generateSearchLink(testQuery, 'anime');

    return { animeLink, mangaLink, searchLink };
  };

  const { animeLink, mangaLink, searchLink } = generateTestLinks();

  const testCopyLink = async (link: string, type: string) => {
    const success = await deepLinkingService.copyToClipboard(link);
    if (success) {
      toast.success(`${type} link copied!`);
    } else {
      toast.error("Failed to copy link");
    }
  };

  const testShareData = {
    title: "Test Anime Share",
    text: "Check out this amazing anime on AniVault!",
    url: animeLink,
    image: "/placeholder.svg"
  };

  const trackingParams = deepLinkingService.parseTrackingParams();

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-primary" />
          Phase 5: Deep Linking System Testing
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Link Generation */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Link Generation Tests
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Anime ID:</label>
              <Input
                value={testAnimeId}
                onChange={(e) => setTestAnimeId(e.target.value)}
                placeholder="Enter anime ID"
              />
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => testCopyLink(animeLink, 'Anime')}
                >
                  Copy Anime Link
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => window.open(animeLink, '_blank')}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Manga ID:</label>
              <Input
                value={testMangaId}
                onChange={(e) => setTestMangaId(e.target.value)}
                placeholder="Enter manga ID"
              />
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => testCopyLink(mangaLink, 'Manga')}
                >
                  Copy Manga Link
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => window.open(mangaLink, '_blank')}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Query:</label>
            <Input
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Enter search query"
            />
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => testCopyLink(searchLink, 'Search')}
              >
                Copy Search Link
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => window.open(searchLink, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Share Button Test */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Share Component Test
          </h4>
          
          <div className="flex items-center gap-4">
        <ShareButton
          shareData={testShareData}
          variant="default"
          size="sm"
          showLabel={true}
        />
            <span className="text-sm text-muted-foreground">
              Try the share functionality
            </span>
          </div>
        </div>

        {/* Current Tracking Parameters */}
        <div className="space-y-4">
          <h4 className="font-semibold">Current Tracking Parameters</h4>
          
          {Object.keys(trackingParams).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(trackingParams).map(([key, value]) => (
                <Badge key={key} variant="secondary">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tracking parameters detected. Try visiting with ?utm_source=test
            </p>
          )}
        </div>

        {/* Generated Links Preview */}
        <div className="space-y-4">
          <h4 className="font-semibold">Generated Links Preview</h4>
          
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Anime:</span>
              <p className="text-xs break-all font-mono">{animeLink}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Manga:</span>
              <p className="text-xs break-all font-mono">{mangaLink}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Search:</span>
              <p className="text-xs break-all font-mono">{searchLink}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};