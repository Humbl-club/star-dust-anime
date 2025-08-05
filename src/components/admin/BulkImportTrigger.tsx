import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Play, Download, Database } from 'lucide-react';

export function BulkImportTrigger() {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const triggerImport = async (contentType: 'anime' | 'manga', maxPages: number = 5) => {
    try {
      setImporting(true);
      toast.info(`Starting ${contentType} import...`);

      const { data, error } = await supabase.functions.invoke('one-time-anilist-bulk-import', {
        body: {
          contentType,
          maxPages,
          startPage: 1
        }
      });

      if (error) {
        throw error;
      }

      setResults(data);
      toast.success(`${contentType} import completed successfully!`);
      console.log('Import results:', data);

    } catch (error) {
      console.error('Import failed:', error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            AniList Bulk Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => triggerImport('anime', 5)}
              disabled={importing}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Import Anime (5 pages)
            </Button>
            
            <Button
              onClick={() => triggerImport('manga', 3)}
              disabled={importing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Import Manga (3 pages)
            </Button>
          </div>

          {importing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Import in progress... This may take several minutes.
            </div>
          )}

          {results && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Import Results:</h4>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}