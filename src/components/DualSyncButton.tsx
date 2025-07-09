import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, Play, BookOpen } from 'lucide-react';
import { useDualSync } from '@/hooks/useDualSync';

export const DualSyncButton = () => {
  const { syncBothTypes, loading, results } = useDualSync();
  const [showResults, setShowResults] = useState(false);

  const handleSync = async () => {
    setShowResults(false);
    await syncBothTypes(2); // Sync 2 pages of each type
    setShowResults(true);
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Simultaneous Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sync both anime and manga data simultaneously from AniList
            </p>
            
            <Button 
              onClick={handleSync} 
              disabled={loading}
              className="w-full"
              variant="hero"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing Both Types...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Anime + Manga
                </>
              )}
            </Button>

            {showResults && results.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Sync Results:</h4>
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      {result.contentType === 'anime' ? (
                        <Play className="w-4 h-4 text-primary" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-secondary" />
                      )}
                      <span className="capitalize font-medium">{result.contentType}</span>
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {result.success && result.processed !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          {result.processed} items
                        </Badge>
                      )}
                      <Badge 
                        variant={result.success ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {result.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};