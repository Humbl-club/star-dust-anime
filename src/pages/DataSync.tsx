import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { 
  Database,
  Server,
  Check,
  Image
} from "lucide-react";
import { CompleteAniListSync } from "@/components/CompleteAniListSync";

const DataSync = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Navigation />
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Database className="w-8 h-8" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Data Sync
              </h1>
            </div>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Sync anime and manga data from external APIs and manage cached images.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Server className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">External APIs</h3>
              <p className="text-sm text-muted-foreground">
                Fetch data from MyAnimeList via Jikan API
              </p>
              <Badge variant="secondary" className="mt-2">
                <Check className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Database className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Local Database</h3>
              <p className="text-sm text-muted-foreground">
                Cached anime and manga data in Supabase
              </p>
              <Badge variant="secondary" className="mt-2">
                <Check className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Image className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Image Cache</h3>
              <p className="text-sm text-muted-foreground">
                Optimized image storage in Supabase
              </p>
              <Badge variant="secondary" className="mt-2">
                <Check className="w-3 h-3 mr-1" />
                Available
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Complete AniList Sync - Main Sync Interface */}
        <CompleteAniListSync />


        {/* Instructions */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4">How The Comprehensive Sync Works</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">AniList GraphQL Integration</p>
                  <p className="text-xs text-muted-foreground">Fetches data directly from AniList's comprehensive database with full metadata</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Normalized Database Structure</p>
                  <p className="text-xs text-muted-foreground">Creates proper relationships between titles, genres, studios, and authors</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Duplicate Prevention</p>
                  <p className="text-xs text-muted-foreground">Uses AniList IDs to prevent duplicate entries during large syncs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Rate Limiting & Error Handling</p>
                  <p className="text-xs text-muted-foreground">Respects API limits (90 requests/minute) with proper error recovery</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataSync;