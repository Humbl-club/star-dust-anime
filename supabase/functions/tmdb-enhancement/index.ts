import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const tmdbApiKey = Deno.env.get('TMDB_API_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  media_type?: 'movie' | 'tv';
  genre_ids: number[];
}

interface TMDBCredits {
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!tmdbApiKey) {
      throw new Error('TMDB API key not configured');
    }

    const { animeIds, forceUpdate = false, maxResults = 50 } = await req.json();
    
    console.log(`Starting TMDB enhancement for ${animeIds?.length || 'all'} anime titles`);

    // Get anime that need TMDB enhancement
    let query = supabase
      .from('anime')
      .select('id, title, title_english, title_japanese, year, tmdb_id, tmdb_type')
      .limit(maxResults);

    if (animeIds && animeIds.length > 0) {
      query = query.in('id', animeIds);
    } else if (!forceUpdate) {
      // Only get anime without TMDB data
      query = query.is('tmdb_id', null);
    }

    const { data: animeList, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch anime: ${fetchError.message}`);
    }

    if (!animeList || animeList.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No anime found that need TMDB enhancement',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processed = 0;
    let enhanced = 0;
    let errors = 0;

    for (const anime of animeList) {
      try {
        // Create search queries with different title variations
        const searchQueries = [
          anime.title,
          anime.title_english,
          anime.title_japanese,
          `${anime.title} anime`,
          anime.title_english ? `${anime.title_english} anime` : null,
        ].filter(Boolean).slice(0, 3); // Limit to 3 searches per anime

        let bestMatch: TMDBSearchResult | null = null;
        let bestScore = 0;

        // Try each search query
        for (const searchQuery of searchQueries) {
          const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(searchQuery!)}&include_adult=false`;
          
          const response = await fetch(searchUrl);
          if (!response.ok) {
            console.error(`TMDB API error for "${anime.title}": ${response.status}`);
            continue;
          }

          const data = await response.json();
          const results = data.results || [];

          // Score each result
          for (const result of results.slice(0, 5)) { // Only check top 5 results
            let score = 0;
            const title = result.title || result.name || '';
            
            // Title similarity scoring
            if (title.toLowerCase() === anime.title.toLowerCase()) score += 10;
            else if (title.toLowerCase().includes(anime.title.toLowerCase())) score += 5;
            else if (anime.title.toLowerCase().includes(title.toLowerCase())) score += 3;
            
            // English title match
            if (anime.title_english && title.toLowerCase() === anime.title_english.toLowerCase()) score += 8;
            
            // Year proximity (if available)
            if (anime.year) {
              const releaseYear = new Date(result.release_date || result.first_air_date || '').getFullYear();
              if (releaseYear === anime.year) score += 5;
              else if (Math.abs(releaseYear - anime.year) <= 1) score += 2;
              else if (Math.abs(releaseYear - anime.year) <= 2) score += 1;
            }
            
            // Media type preference (TV shows are better for anime)
            if (result.media_type === 'tv') score += 3;
            else if (result.media_type === 'movie') score += 1;
            
            // Quality indicators
            if (result.vote_count > 100) score += 1;
            if (result.vote_average > 7) score += 1;
            
            // Popularity boost
            score += Math.min(result.popularity / 100, 2);

            if (score > bestScore) {
              bestMatch = result;
              bestScore = score;
            }
          }

          if (bestScore >= 10) break; // Good enough match found
        }

        if (bestMatch && bestScore >= 5) {
          // Fetch additional details and credits
          const detailsUrl = `https://api.themoviedb.org/3/${bestMatch.media_type}/${bestMatch.id}?api_key=${tmdbApiKey}`;
          const creditsUrl = `https://api.themoviedb.org/3/${bestMatch.media_type}/${bestMatch.id}/credits?api_key=${tmdbApiKey}`;
          
          const [detailsResponse, creditsResponse] = await Promise.all([
            fetch(detailsUrl),
            fetch(creditsUrl)
          ]);

          let tmdbData: any = {};
          let castData: any[] = [];
          let crewData: any[] = [];

          if (detailsResponse.ok) {
            tmdbData = await detailsResponse.json();
          }

          if (creditsResponse.ok) {
            const credits: TMDBCredits = await creditsResponse.json();
            castData = credits.cast.slice(0, 10); // Top 10 cast members
            crewData = credits.crew.filter(c => 
              ['Director', 'Producer', 'Executive Producer', 'Writer', 'Screenplay'].includes(c.job)
            ).slice(0, 10); // Key crew members
          }

          // Update anime with TMDB data
          const updateData = {
            tmdb_id: bestMatch.id,
            tmdb_type: bestMatch.media_type,
            tmdb_poster_path: bestMatch.poster_path,
            tmdb_backdrop_path: bestMatch.backdrop_path,
            tmdb_overview: bestMatch.overview,
            tmdb_vote_average: bestMatch.vote_average,
            tmdb_vote_count: bestMatch.vote_count,
            tmdb_popularity: bestMatch.popularity,
            tmdb_genre_ids: bestMatch.genre_ids,
            tmdb_cast_data: castData,
            tmdb_crew_data: crewData,
            tmdb_details: tmdbData,
            updated_at: new Date().toISOString()
          };

          const { error: updateError } = await supabase
            .from('anime')
            .update(updateData)
            .eq('id', anime.id);

          if (updateError) {
            console.error(`Failed to update anime ${anime.title}:`, updateError);
            errors++;
          } else {
            console.log(`✅ Enhanced "${anime.title}" with TMDB data (Score: ${bestScore})`);
            enhanced++;
          }
        } else {
          console.log(`❌ No suitable TMDB match found for "${anime.title}" (Best Score: ${bestScore})`);
        }

        processed++;

        // Add delay to respect TMDB API rate limits (40 requests per 10 seconds)
        await new Promise(resolve => setTimeout(resolve, 250));

      } catch (error: any) {
        console.error(`Error processing anime "${anime.title}":`, error);
        errors++;
        processed++;
      }
    }

    console.log(`TMDB enhancement completed: ${processed} processed, ${enhanced} enhanced, ${errors} errors`);

    return new Response(JSON.stringify({
      success: true,
      processed,
      enhanced,
      errors,
      message: `Processed ${processed} anime titles, enhanced ${enhanced} with TMDB data`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('TMDB enhancement error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});