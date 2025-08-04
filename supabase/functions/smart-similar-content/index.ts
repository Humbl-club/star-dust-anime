import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SimilarContentResult {
  id: string;
  title: string;
  title_english?: string;
  title_japanese?: string;
  image_url: string;
  score: number;
  anilist_id: number;
  match_reason: string;
  confidence_score: number;
  relation_type?: string;
  genres?: any[];
  studios?: any[];
  authors?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { titleId, contentType, limit = 12 } = await req.json();
    
    if (!titleId || !contentType) {
      throw new Error('Title ID and content type are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🎯 Finding similar content for ${contentType} ${titleId}`);

    const results: SimilarContentResult[] = [];
    
    // Step 1: Get current title data with AniList recommendations and relations
    const { data: currentTitle } = await supabase
      .from('titles')
      .select(`
        *,
        ${contentType}_details!inner(*),
        title_genres(genres(*))
      `)
      .eq('id', titleId)
      .single();

    if (!currentTitle) {
      throw new Error('Title not found');
    }

    const currentGenreIds = currentTitle.title_genres?.map((tg: any) => tg.genres.id) || [];
    console.log(`📊 Current title has ${currentGenreIds.length} genres`);

    // Step 2: Primary source - AniList recommendations
    if (currentTitle.recommendations_data?.recommendations) {
      console.log('🎯 Using AniList recommendations as primary source');
      
      for (const rec of currentTitle.recommendations_data.recommendations.slice(0, 8)) {
        if (rec.mediaRecommendation?.idMal) {
          const { data: recTitle } = await supabase
            .from('titles')
            .select(`
              *,
              ${contentType}_details!inner(*),
              title_genres(genres(*)),
              title_studios(studios(*)),
              title_authors(authors(*))
            `)
            .eq('anilist_id', rec.mediaRecommendation.id)
            .maybeSingle();

          if (recTitle) {
            results.push({
              id: recTitle.id,
              title: recTitle.title,
              title_english: recTitle.title_english,
              title_japanese: recTitle.title_japanese,
              image_url: recTitle.image_url,
              score: recTitle.score || 0,
              anilist_id: recTitle.anilist_id,
              match_reason: 'AniList Recommendation',
              confidence_score: Math.min(95, (rec.rating || 50) + 20),
              genres: recTitle.title_genres?.map((tg: any) => tg.genres),
              studios: recTitle.title_studios?.map((ts: any) => ts.studios),
              authors: recTitle.title_authors?.map((ta: any) => ta.authors)
            });
          }
        }
      }
    }

    // Step 3: Secondary source - AniList relations with priority
    if (currentTitle.relations_data?.relations && results.length < limit) {
      console.log('🔗 Using AniList relations as secondary source');
      
      const priorityTypes = ['SEQUEL', 'PREQUEL', 'ALTERNATIVE', 'SIDE_STORY', 'PARENT', 'ADAPTATION'];
      
      for (const relType of priorityTypes) {
        const relations = currentTitle.relations_data.relations.filter(
          (rel: any) => rel.relationType === relType
        );
        
        for (const relation of relations) {
          if (results.length >= limit) break;
          
          if (relation.node?.id) {
            const { data: relTitle } = await supabase
              .from('titles')
              .select(`
                *,
                ${contentType}_details!inner(*),
                title_genres(genres(*)),
                title_studios(studios(*)),
                title_authors(authors(*))
              `)
              .eq('anilist_id', relation.node.id)
              .maybeSingle();

            if (relTitle && !results.some(r => r.id === relTitle.id)) {
              const confidenceMap: { [key: string]: number } = {
                'SEQUEL': 90,
                'PREQUEL': 90,
                'ALTERNATIVE': 85,
                'SIDE_STORY': 80,
                'PARENT': 75,
                'ADAPTATION': 70
              };

              results.push({
                id: relTitle.id,
                title: relTitle.title,
                title_english: relTitle.title_english,
                title_japanese: relTitle.title_japanese,
                image_url: relTitle.image_url,
                score: relTitle.score || 0,
                anilist_id: relTitle.anilist_id,
                match_reason: `${relType.charAt(0) + relType.slice(1).toLowerCase().replace('_', ' ')}`,
                confidence_score: confidenceMap[relType] || 70,
                relation_type: relType,
                genres: relTitle.title_genres?.map((tg: any) => tg.genres),
                studios: relTitle.title_studios?.map((ts: any) => ts.studios),
                authors: relTitle.title_authors?.map((ta: any) => ta.authors)
              });
            }
          }
        }
      }
    }

    // Step 4: Collaborative filtering fallback
    if (results.length < limit) {
      console.log('🤝 Using collaborative filtering as fallback');
      
      // Find users who rated this title highly (8+ score)
      const { data: similarUsers } = await supabase
        .from('user_title_lists')
        .select('user_id')
        .eq('title_id', titleId)
        .gte('score', 8)
        .limit(100);

      if (similarUsers && similarUsers.length > 0) {
        const userIds = similarUsers.map(u => u.user_id);
        
        // Get their other highly-rated titles in same genres
        const { data: collaborativeRecs } = await supabase
          .from('user_title_lists')
          .select(`
            title_id,
            score,
            titles!inner(
              *,
              ${contentType}_details!inner(*),
              title_genres!inner(
                genres!inner(*)
              ),
              title_studios(studios(*)),
              title_authors(authors(*))
            )
          `)
          .in('user_id', userIds)
          .gte('score', 8)
          .neq('title_id', titleId)
          .in('titles.title_genres.genres.id', currentGenreIds)
          .order('score', { ascending: false })
          .limit(20);

        if (collaborativeRecs) {
          // Count frequency and calculate confidence
          const titleFrequency: { [key: string]: { count: number; avgScore: number; title: any } } = {};
          
          collaborativeRecs.forEach(rec => {
            const id = rec.titles.id;
            if (!titleFrequency[id]) {
              titleFrequency[id] = { count: 0, avgScore: 0, title: rec.titles };
            }
            titleFrequency[id].count++;
            titleFrequency[id].avgScore += rec.score;
          });

          // Convert to results
          Object.entries(titleFrequency)
            .filter(([id]) => !results.some(r => r.id === id))
            .sort(([,a], [,b]) => (b.count * b.avgScore) - (a.count * a.avgScore))
            .slice(0, limit - results.length)
            .forEach(([id, data]) => {
              const title = data.title;
              const confidence = Math.min(85, 40 + (data.count * 10) + (data.avgScore / data.count * 5));
              
              results.push({
                id: title.id,
                title: title.title,
                title_english: title.title_english,
                title_japanese: title.title_japanese,
                image_url: title.image_url,
                score: title.score || 0,
                anilist_id: title.anilist_id,
                match_reason: `Liked by ${data.count} similar user${data.count > 1 ? 's' : ''}`,
                confidence_score: confidence,
                genres: title.title_genres?.map((tg: any) => tg.genres),
                studios: title.title_studios?.map((ts: any) => ts.studios),
                authors: title.title_authors?.map((ta: any) => ta.authors)
              });
            });
        }
      }
    }

    // Step 5: Tertiary fallback - Genre/Studio matching
    if (results.length < limit) {
      console.log('🎨 Using genre/studio matching as tertiary fallback');
      
      const detailsTable = contentType === 'anime' ? 'anime_details' : 'manga_details';
      const relationTable = contentType === 'anime' ? 'title_studios' : 'title_authors';
      const relatedTable = contentType === 'anime' ? 'studios' : 'authors';
      
      const { data: genreMatches } = await supabase
        .from('titles')
        .select(`
          *,
          ${detailsTable}!inner(*),
          title_genres!inner(genres!inner(*)),
          ${relationTable}(${relatedTable}(*))
        `)
        .neq('id', titleId)
        .in('title_genres.genres.id', currentGenreIds)
        .gte('score', 6)
        .order('score', { ascending: false })
        .limit(limit - results.length);

      if (genreMatches) {
        genreMatches
          .filter(match => !results.some(r => r.id === match.id))
          .forEach(match => {
            const sharedGenres = match.title_genres?.filter((tg: any) => 
              currentGenreIds.includes(tg.genres.id)
            ).length || 0;
            
            const confidence = Math.min(75, 30 + (sharedGenres * 10) + (match.score || 0) * 5);
            
            results.push({
              id: match.id,
              title: match.title,
              title_english: match.title_english,
              title_japanese: match.title_japanese,
              image_url: match.image_url,
              score: match.score || 0,
              anilist_id: match.anilist_id,
              match_reason: `${sharedGenres} shared genre${sharedGenres > 1 ? 's' : ''}`,
              confidence_score: confidence,
              genres: match.title_genres?.map((tg: any) => tg.genres),
              studios: match[relationTable]?.map((ts: any) => ts[relatedTable]),
              authors: match[relationTable]?.map((ta: any) => ta[relatedTable])
            });
          });
      }
    }

    // Sort by confidence score and limit results
    const finalResults = results
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, limit);

    console.log(`✅ Found ${finalResults.length} similar titles`);
    console.log(`   Confidence range: ${Math.min(...finalResults.map(r => r.confidence_score))}% - ${Math.max(...finalResults.map(r => r.confidence_score))}%`);

    return new Response(JSON.stringify({
      success: true,
      results: finalResults,
      total: finalResults.length,
      cache_duration: 86400 // 24 hours
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Smart similar content error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});