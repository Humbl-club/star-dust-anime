import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface PendingMatch {
  id: string;
  kitsu_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis?: string;
  image_url?: string;
  score?: number;
  year?: number;
  content_type: string;
  potential_matches: Array<{
    title_id: string;
    title: string;
    title_english?: string;
    title_japanese?: string;
    content_type: string;
    similarity_score: number;
  }>;
  confidence_score: number;
  admin_decision?: string;
  created_at: string;
}

export function PendingMatchesManager() {
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'anime' | 'manga'>('all');

  useEffect(() => {
    fetchPendingMatches();
  }, [filter]);

  const fetchPendingMatches = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('pending_matches')
        .select('*')
        .is('admin_decision', null)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('content_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPendingMatches(data?.map(item => ({
        ...item,
        potential_matches: Array.isArray(item.potential_matches) 
          ? item.potential_matches as PendingMatch['potential_matches']
          : []
      })) || []);
    } catch (error) {
      console.error('Error fetching pending matches:', error);
      toast.error('Failed to fetch pending matches');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (matchId: string, decision: 'approved' | 'rejected' | 'merged', targetTitleId?: string) => {
    try {
      const { error } = await supabase
        .from('pending_matches')
        .update({
          admin_decision: decision,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) throw error;

      if (decision === 'approved') {
        // Create new title from the pending match
        const match = pendingMatches.find(m => m.id === matchId);
        if (match) {
          await createTitleFromPendingMatch(match);
        }
      } else if (decision === 'merged' && targetTitleId) {
        // Merge with existing title
        const match = pendingMatches.find(m => m.id === matchId);
        if (match) {
          await mergeWithExistingTitle(match, targetTitleId);
        }
      }

      toast.success(`Decision recorded: ${decision}`);
      fetchPendingMatches(); // Refresh the list
    } catch (error) {
      console.error('Error recording decision:', error);
      toast.error('Failed to record decision');
    }
  };

  const createTitleFromPendingMatch = async (match: PendingMatch) => {
    try {
      const titleData = {
        id_kitsu: match.kitsu_id,
        title: match.title,
        title_english: match.title_english,
        title_japanese: match.title_japanese,
        synopsis: match.synopsis,
        image_url: match.image_url,
        score: match.score,
        year: match.year
      };

      const contentData = match.content_type === 'anime' ? 
        { status: 'Unknown', type: 'Unknown' } : 
        { status: 'Unknown', type: 'Unknown' };

      const { error } = await supabase.rpc('insert_title_with_details', {
        title_data: titleData,
        anime_data: match.content_type === 'anime' ? contentData : null,
        manga_data: match.content_type === 'manga' ? contentData : null,
        genre_names: [],
        studio_names: [],
        author_names: []
      });

      if (error) throw error;

      toast.success('New title created successfully');
    } catch (error) {
      console.error('Error creating title:', error);
      toast.error('Failed to create new title');
    }
  };

  const mergeWithExistingTitle = async (match: PendingMatch, targetTitleId: string) => {
    try {
      // Update the existing title with Kitsu ID and any missing data
      const { error } = await supabase
        .from('titles')
        .update({
          id_kitsu: match.kitsu_id,
          // Only update fields that are empty
          title_english: match.title_english,
          title_japanese: match.title_japanese,
          synopsis: match.synopsis,
          image_url: match.image_url
        })
        .eq('id', targetTitleId);

      if (error) throw error;

      toast.success('Successfully merged with existing title');
    } catch (error) {
      console.error('Error merging title:', error);
      toast.error('Failed to merge with existing title');
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-100 text-green-800';
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pending Match Reviews</h2>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({pendingMatches.length})
          </Button>
          <Button 
            variant={filter === 'anime' ? 'default' : 'outline'}
            onClick={() => setFilter('anime')}
          >
            Anime
          </Button>
          <Button 
            variant={filter === 'manga' ? 'default' : 'outline'}
            onClick={() => setFilter('manga')}
          >
            Manga
          </Button>
        </div>
      </div>

      {pendingMatches.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">No pending matches require review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingMatches.map((match) => (
            <Card key={match.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {match.title}
                      <Badge variant="outline">{match.content_type}</Badge>
                      <Badge className={getConfidenceColor(match.confidence_score)}>
                        {Math.round(match.confidence_score * 100)}% confidence
                      </Badge>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      Kitsu ID: {match.kitsu_id} • 
                      {match.title_english && ` EN: ${match.title_english} •`}
                      {match.title_japanese && ` JP: ${match.title_japanese} •`}
                      {match.year && ` Year: ${match.year}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {match.image_url && (
                      <img 
                        src={match.image_url} 
                        alt={match.title}
                        className="w-16 h-24 object-cover rounded"
                      />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {match.synopsis && (
                  <div>
                    <h4 className="font-medium mb-2">Synopsis</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {match.synopsis}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3">Potential Matches Found</h4>
                  <div className="space-y-2">
                    {match.potential_matches.map((potentialMatch, index) => (
                      <div 
                        key={potentialMatch.title_id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{potentialMatch.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {potentialMatch.title_english && `EN: ${potentialMatch.title_english} • `}
                            Similarity: {Math.round(potentialMatch.similarity_score * 100)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{potentialMatch.content_type}</Badge>
                          <Button
                            size="sm"
                            onClick={() => handleDecision(match.id, 'merged', potentialMatch.title_id)}
                          >
                            Merge
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    variant="default"
                    onClick={() => handleDecision(match.id, 'approved')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Create New
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDecision(match.id, 'rejected')}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://kitsu.io/${match.content_type}/${match.kitsu_id}`, '_blank')}
                    className="flex items-center gap-2 ml-auto"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Kitsu
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}