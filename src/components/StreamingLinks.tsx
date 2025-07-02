import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ExternalLink {
  id: number;
  url: string;
  site: string;
  siteId?: number;
  type: string;
  language?: string;
  color?: string;
  icon?: string;
}

interface StreamingLinksProps {
  externalLinks: ExternalLink[];
  colorTheme?: string;
}

export const StreamingLinks = ({ externalLinks, colorTheme }: StreamingLinksProps) => {
  if (!externalLinks?.length) return null;

  // Filter for streaming platforms
  const streamingLinks = externalLinks.filter(link => 
    ['STREAMING', 'SOCIAL'].includes(link.type) &&
    ['Crunchyroll', 'Funimation', 'Netflix', 'Hulu', 'Amazon Prime Video', 'Disney Plus', 'AnimeLab', 'Wakanim'].includes(link.site)
  );

  const socialLinks = externalLinks.filter(link => 
    link.type === 'SOCIAL' &&
    ['Twitter', 'YouTube', 'Instagram', 'TikTok'].includes(link.site)
  );

  const otherLinks = externalLinks.filter(link => 
    !streamingLinks.includes(link) && !socialLinks.includes(link)
  );

  const getSiteIcon = (site: string) => {
    const icons: Record<string, string> = {
      'Crunchyroll': '🟠',
      'Funimation': '🟣',
      'Netflix': '🔴',
      'Hulu': '🟢',
      'Amazon Prime Video': '🔵',
      'Disney Plus': '🔵',
      'Twitter': '🐦',
      'YouTube': '📺',
      'Instagram': '📷',
      'TikTok': '🎵',
      'MyAnimeList': '📊',
      'AniDB': '📚',
      'Anime News Network': '📰',
    };
    return icons[site] || '🔗';
  };

  const LinkCard = ({ link, index }: { link: ExternalLink; index: number }) => (
    <Button
      variant="outline"
      size="sm"
      asChild
      className="h-auto p-3 justify-start hover:scale-[1.02] transition-all duration-200 animate-fade-in"
      style={{ 
        animationDelay: `${0.1 + (index * 0.05)}s`,
        borderColor: link.color ? `${link.color}40` : colorTheme ? `${colorTheme}40` : undefined
      }}
    >
      <a href={link.url} target="_blank" rel="noopener noreferrer">
        <div className="flex items-center gap-3 w-full">
          <span className="text-lg">{getSiteIcon(link.site)}</span>
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">{link.site}</div>
            {link.type && (
              <div className="text-xs text-muted-foreground capitalize">
                {link.type.toLowerCase()}
              </div>
            )}
          </div>
          <ExternalLink className="w-4 h-4 opacity-60" />
        </div>
      </a>
    </Button>
  );

  if (streamingLinks.length === 0 && socialLinks.length === 0 && otherLinks.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in">
      <CardContent className="p-8">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ExternalLink className="w-6 h-6 text-primary" />
          Watch & Follow
        </h3>

        <div className="space-y-6">
          {/* Streaming Platforms */}
          {streamingLinks.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-green-600">
                🎬 Streaming Platforms
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {streamingLinks.map((link, index) => (
                  <LinkCard key={link.id} link={link} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Social Media */}
          {socialLinks.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-blue-600">
                📱 Social Media
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {socialLinks.map((link, index) => (
                  <LinkCard key={link.id} link={link} index={index + streamingLinks.length} />
                ))}
              </div>
            </div>
          )}

          {/* Other Links */}
          {otherLinks.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-purple-600">
                🔗 More Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {otherLinks.map((link, index) => (
                  <LinkCard 
                    key={link.id} 
                    link={link} 
                    index={index + streamingLinks.length + socialLinks.length} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
