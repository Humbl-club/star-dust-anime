import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Database, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const ContentManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState('anime');

  const { data: content, isLoading } = useQuery({
    queryKey: ['admin-content', activeType, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('titles')
        .select(`
          id,
          title,
          image_url,
          score,
          year,
          created_at,
          ${activeType === 'anime' ? 'anime_details(status, episodes)' : 'manga_details(status, chapters)'}
        `)
        .limit(20);

      if (activeType === 'anime') {
        query = query.not('anime_details', 'is', null);
      } else {
        query = query.not('manga_details', 'is', null);
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const syncContent = async () => {
    try {
      await supabase.functions.invoke('sync-anime', {
        body: { pages: 1 }
      });
      // Refresh the data after sync
      window.location.reload();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Content Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={syncContent} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync Content
            </Button>
          </div>

          <Tabs value={activeType} onValueChange={setActiveType}>
            <TabsList>
              <TabsTrigger value="anime">Anime</TabsTrigger>
              <TabsTrigger value="manga">Manga</TabsTrigger>
            </TabsList>

            <TabsContent value={activeType} className="mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                      <div className="w-16 h-20 bg-muted rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {content?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <img
                        src={item.image_url || '/placeholder.svg'}
                        alt={item.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {(item as any).anime_details?.[0]?.status || 
                             (item as any).manga_details?.[0]?.status || 'Unknown'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Score: {item.score || 'N/A'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Year: {item.year || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};