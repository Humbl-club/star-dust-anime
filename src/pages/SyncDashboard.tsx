import { Navigation } from "@/components/Navigation";
import { useStats } from "@/hooks/useStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveTitleViewer } from "@/components/LiveTitleViewer";
import { 
  Database, 
  RefreshCw, 
  BarChart3
} from "lucide-react";

const SyncDashboard = () => {
  const { stats, loading: statsLoading, formatCount } = useStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-gradient-primary">
              Automated Dual Sync Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Automated background sync runs every 2 minutes, simultaneously updating anime and manga database
          </p>
        </div>

        {/* Sync Status */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-500" />
              Background Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-green-500 font-semibold mb-2">Active</div>
              <p className="text-muted-foreground text-sm">
                Background sync is running automatically every 2 minutes
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Database Statistics */}
        <Card className="mt-8 mb-8 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Current Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading statistics...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{formatCount(stats.animeCount)}</div>
                  <div className="text-sm text-muted-foreground">Anime Titles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{formatCount(stats.mangaCount)}</div>
                  <div className="text-sm text-muted-foreground">Manga Titles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{formatCount(stats.animeCount + stats.mangaCount)}</div>
                  <div className="text-sm text-muted-foreground">Total Titles</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        
        {/* Live Title Viewer */}
        <LiveTitleViewer />

        {/* Automated Sync Info */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-muted-foreground" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                • <strong>Automated Dual Sync:</strong> Runs every 2 minutes automatically syncing both anime and manga simultaneously
              </p>
              <p>
                • <strong>Ultra-Fast Processing:</strong> Uses the ultra-fast-sync function to process 3 pages of anime and 3 pages of manga per run
              </p>
              <p>
                • <strong>Real AniList Data:</strong> Fetches actual content from AniList API with full metadata, genres, studios, and relationships
              </p>
              <p>
                • <strong>Normalized Database:</strong> Properly stores data in the normalized schema with titles, anime_details, manga_details, and relationships
              </p>
              <p>
                • <strong>No Duplicates:</strong> Automatically skips existing titles based on anilist_id to prevent data duplication
              </p>
              <p>
                • <strong>Parallel Processing:</strong> Anime and manga sync run simultaneously using Promise.all() for maximum efficiency
              </p>
              <p>
                • <strong>Zero Maintenance:</strong> Continues running until the entire AniList database is synchronized
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SyncDashboard;