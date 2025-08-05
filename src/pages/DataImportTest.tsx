import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Play, Download, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DataImportTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // AniList bulk import state
  const [anilistParams, setAnilistParams] = useState({
    contentType: 'anime',
    maxPages: 2,
    startPage: 1
  });

  // Kitsu reconciliation state
  const [kitsuParams, setKitsuParams] = useState({
    contentType: 'anime',
    limit: 10,
    daysBack: 7
  });

  const runAniListImport = async () => {
    try {
      setLoading(true);
      setResults(null);
      
      console.log('Starting AniList bulk import...', anilistParams);
      
      const { data, error } = await supabase.functions.invoke('one-time-anilist-bulk-import', {
        body: anilistParams
      });

      if (error) throw error;

      setResults(data);
      
      if (data.success) {
        toast.success(`Import completed! Processed ${data.totalProcessed} items`);
      } else {
        toast.error('Import failed: ' + data.error);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const runKitsuReconciliation = async () => {
    try {
      setLoading(true);
      setResults(null);
      
      console.log('Starting Kitsu reconciliation...', kitsuParams);
      
      const { data, error } = await supabase.functions.invoke('reconcile-kitsu-daily', {
        body: kitsuParams
      });

      if (error) throw error;

      setResults(data);
      
      if (data.success) {
        toast.success(`Reconciliation completed! Processed ${data.processedCount} items`);
      } else {
        toast.error('Reconciliation failed: ' + data.error);
      }
    } catch (error) {
      console.error('Reconciliation error:', error);
      toast.error('Reconciliation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Data Import & Reconciliation Testing</h1>
          <p className="text-muted-foreground">
            Test the hybrid data management system with AniList bulk import and Kitsu reconciliation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AniList Bulk Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                AniList Bulk Import
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                One-time bulk import from AniList API to populate your database.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="anilist-type">Content Type</Label>
                  <Select 
                    value={anilistParams.contentType} 
                    onValueChange={(value) => setAnilistParams(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anime">Anime</SelectItem>
                      <SelectItem value="manga">Manga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="anilist-pages">Max Pages</Label>
                  <Input
                    id="anilist-pages"
                    type="number"
                    min="1"
                    max="20"
                    value={anilistParams.maxPages}
                    onChange={(e) => setAnilistParams(prev => ({ 
                      ...prev, 
                      maxPages: parseInt(e.target.value) || 1 
                    }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="anilist-start">Start Page</Label>
                <Input
                  id="anilist-start"
                  type="number"
                  min="1"
                  value={anilistParams.startPage}
                  onChange={(e) => setAnilistParams(prev => ({ 
                    ...prev, 
                    startPage: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> This will import {anilistParams.maxPages * 50} {anilistParams.contentType} items 
                  starting from page {anilistParams.startPage}. Rate limited to 1 request per second.
                </p>
              </div>
              <Button 
                onClick={runAniListImport} 
                disabled={loading}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {loading ? 'Importing...' : 'Start AniList Import'}
              </Button>
            </CardContent>
          </Card>

          {/* Kitsu Reconciliation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Kitsu Reconciliation
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily reconciliation with Kitsu API using fuzzy matching.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kitsu-type">Content Type</Label>
                  <Select 
                    value={kitsuParams.contentType} 
                    onValueChange={(value) => setKitsuParams(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anime">Anime</SelectItem>
                      <SelectItem value="manga">Manga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kitsu-limit">Limit</Label>
                  <Input
                    id="kitsu-limit"
                    type="number"
                    min="1"
                    max="50"
                    value={kitsuParams.limit}
                    onChange={(e) => setKitsuParams(prev => ({ 
                      ...prev, 
                      limit: parseInt(e.target.value) || 10 
                    }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="kitsu-days">Days Back</Label>
                <Input
                  id="kitsu-days"
                  type="number"
                  min="1"
                  max="30"
                  value={kitsuParams.daysBack}
                  onChange={(e) => setKitsuParams(prev => ({ 
                    ...prev, 
                    daysBack: parseInt(e.target.value) || 7 
                  }))}
                />
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> This will fetch {kitsuParams.limit} recently updated {kitsuParams.contentType} 
                  items from the last {kitsuParams.daysBack} days and attempt to reconcile with existing data.
                </p>
              </div>
              <Button 
                onClick={runKitsuReconciliation} 
                disabled={loading}
                className="w-full"
                variant="secondary"
              >
                <Zap className="h-4 w-4 mr-2" />
                {loading ? 'Reconciling...' : 'Start Kitsu Reconciliation'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Display */}
        {results && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                Operation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={results.success ? "default" : "destructive"}>
                    {results.success ? "Success" : "Failed"}
                  </Badge>
                  <Badge variant="outline">{results.contentType}</Badge>
                </div>

                {results.success && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {results.totalProcessed !== undefined && (
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{results.totalProcessed}</div>
                        <div className="text-sm text-muted-foreground">Total Processed</div>
                      </div>
                    )}
                    {results.totalCreated !== undefined && (
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">{results.totalCreated}</div>
                        <div className="text-sm text-green-600">Created</div>
                      </div>
                    )}
                    {results.totalUpdated !== undefined && (
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">{results.totalUpdated}</div>
                        <div className="text-sm text-blue-600">Updated</div>
                      </div>
                    )}
                    {results.confidentMatches !== undefined && (
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">{results.confidentMatches}</div>
                        <div className="text-sm text-green-600">Confident Matches</div>
                      </div>
                    )}
                    {results.uncertainMatches !== undefined && (
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-700">{results.uncertainMatches}</div>
                        <div className="text-sm text-yellow-600">Uncertain Matches</div>
                      </div>
                    )}
                    {results.newItems !== undefined && (
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700">{results.newItems}</div>
                        <div className="text-sm text-purple-600">New Items</div>
                      </div>
                    )}
                  </div>
                )}

                {results.errors && results.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">
                      Errors ({results.errorCount || results.errors.length})
                    </h4>
                    <div className="space-y-1">
                      {results.errors.slice(0, 5).map((error: string, index: number) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                      {results.errorCount > 5 && (
                        <p className="text-sm text-muted-foreground">
                          ... and {results.errorCount - 5} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!results.success && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-red-700">{results.error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Processing... This may take a few minutes.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}