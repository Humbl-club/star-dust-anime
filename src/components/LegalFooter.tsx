import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Shield, Scale, FileText, Copyright } from "lucide-react";

export const LegalFooter = () => {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Legal</h3>
            <div className="space-y-2">
              <Link 
                to="/legal/privacy_policy" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Shield className="w-4 h-4" />
                Privacy Policy
              </Link>
              <Link 
                to="/legal/terms_of_service"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Scale className="w-4 h-4" />
                Terms of Service
              </Link>
              <Link 
                to="/legal/content_policy"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="w-4 h-4" />
                Content Policy
              </Link>
              <Link 
                to="/legal/copyright_policy"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copyright className="w-4 h-4" />
                Copyright Policy
              </Link>
            </div>
          </div>

          {/* Data Sources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Data Sources</h3>
            <div className="space-y-2">
              <Link 
                to="/legal/attributions"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copyright className="w-4 h-4" />
                API Attributions
              </Link>
              <a 
                href="https://myanimelist.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
              >
                MyAnimeList
              </a>
              <a 
                href="https://anilist.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
              >
                AniList
              </a>
              <a 
                href="https://jikan.moe" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
              >
                Jikan API
              </a>
            </div>
          </div>

          {/* App Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Star Dust Anime</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Track your anime and manga journey with AI-powered recommendations.</p>
              <p>Built with ❤️ for the anime community.</p>
            </div>
          </div>

          {/* Age Rating Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Content Rating</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>This app contains content with various age ratings:</p>
              <ul className="space-y-1 text-xs">
                <li>• All Ages: Suitable for everyone</li>
                <li>• Teen: Ages 13+</li>
                <li>• Mature: Ages 17+</li>
                <li>• Adult: Ages 18+</li>
              </ul>
              <p className="text-xs">Age verification required for appropriate content filtering.</p>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p>&copy; 2024 Star Dust Anime. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>App Store Ready</span>
              <span>DMCA Compliant</span>
              <span>Content Moderated</span>
            </div>
          </div>
          
          <div className="text-xs">
            <p>Content sourced from public APIs with proper attribution.</p>
            <p>All anime and manga content remains property of respective copyright holders.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};