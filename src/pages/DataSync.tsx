import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Navigation } from "@/components/Navigation";
import { 
  Database,
  Download,
  Image,
  RefreshCw,
  Server,
  Check,
  AlertCircle,
  Play
} from "lucide-react";
import { useApiData } from "@/hooks/useApiData";
import { toast } from "sonner";
import { CompleteAniListSync } from "@/components/CompleteAniListSync";

const DataSync = () => {
  const [animePages, setAnimePages] = useState(1);
  const [mangaPages, setMangaPages] = useState(1);
  const [imageLimit, setImageLimit] = useState(10);
  const [syncing, setSyncing] = useState(false);

  const { 
    syncFromExternal: syncAnime, 
    syncImages: syncAnimeImages 
  } = useApiData<any>({ 
    contentType: 'anime', 
    autoFetch: false 
  });

  const { 
    syncFromExternal: syncManga, 
    syncImages: syncMangaImages 
  } = useApiData<any>({ 
    contentType: 'manga', 
    autoFetch: false 
  });

  const handleSyncAnime = async () => {
    setSyncing(true);
    try {
      await syncAnime(animePages);
      toast.success('Anime data sync completed!');
    } catch (error) {
      toast.error('Failed to sync anime data');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncManga = async () => {
    setSyncing(true);
    try {
      await syncManga(mangaPages);
      toast.success('Manga data sync completed!');
    } catch (error) {
      toast.error('Failed to sync manga data');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncImages = async (type: 'anime' | 'manga') => {
    setSyncing(true);
    try {
      if (type === 'anime') {
        await syncAnimeImages(imageLimit);
      } else {
        await syncMangaImages(imageLimit);
      }
      toast.success(`${type} images sync completed!`);
    } catch (error) {
      toast.error(`Failed to sync ${type} images`);
    } finally {
      setSyncing(false);
    }
  };

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

        {/* Complete AniList Sync */}
        <CompleteAniListSync />

        {/* Anime Data Sync */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Anime Data Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="anime-pages">Pages to Sync (25 items each)</Label>
                <Input
                  id="anime-pages"
                  type="number"
                  min="1"
                  max="20"
                  value={animePages}
                  onChange={(e) => setAnimePages(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
              </div>
              <Button 
                onClick={handleSyncAnime}
                disabled={syncing}
                className="flex items-center gap-2"
              >
                {syncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Sync Anime Data
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Fetches top-rated anime from MyAnimeList. Rate limited to respect API guidelines.
            </div>
          </CardContent>
        </Card>

        {/* Manga Data Sync */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Manga Data Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="manga-pages">Pages to Sync (25 items each)</Label>
                <Input
                  id="manga-pages"
                  type="number"
                  min="1"
                  max="20"
                  value={mangaPages}
                  onChange={(e) => setMangaPages(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
              </div>
              <Button 
                onClick={handleSyncManga}
                disabled={syncing}
                className="flex items-center gap-2"
              >
                {syncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Sync Manga Data
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Fetches top-rated manga from MyAnimeList. Rate limited to respect API guidelines.
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Image Sync */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Image Cache Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="image-limit">Images per batch</Label>
                  <Input
                    id="image-limit"
                    type="number"
                    min="1"
                    max="50"
                    value={imageLimit}
                    onChange={(e) => setImageLimit(parseInt(e.target.value) || 10)}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => handleSyncImages('anime')}
                  disabled={syncing}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {syncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Image className="w-4 h-4" />
                  )}
                  Cache Anime Images
                </Button>

                <Button 
                  onClick={() => handleSyncImages('manga')}
                  disabled={syncing}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {syncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Image className="w-4 h-4" />
                  )}
                  Cache Manga Images
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Downloads external images and stores them in Supabase Storage for faster loading.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Data Sync Process</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Fetch data from Jikan API (MyAnimeList)</li>
                  <li>Process and validate the data</li>
                  <li>Store unique entries in Supabase</li>
                  <li>Update existing entries if needed</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Image Caching</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Download images from external URLs</li>
                  <li>Upload to Supabase Storage buckets</li>
                  <li>Update database with new image URLs</li>
                  <li>Serve images faster to users</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataSync;