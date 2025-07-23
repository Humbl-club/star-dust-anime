import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash, RefreshCw, Database, Eye } from 'lucide-react';

export const ContentManager = () => {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('anime');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: content, isLoading } = useQuery({
    queryKey: ['admin-content', activeType, search],
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

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
  
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ultra-fast-sync', {
        body: { contentType: activeType, pages: 1 }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sync completed",
        description: "Content has been synchronized successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
    },
    onError: (error) => {
      toast({
        title: "Sync failed",
        description: "Failed to synchronize content. Please try again.",
        variant: "destructive",
      });
      console.error('Sync error:', error);
    }
  });
  
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
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
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {content?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No content found. Try adjusting your search or sync some content.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};