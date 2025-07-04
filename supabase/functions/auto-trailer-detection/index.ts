import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

interface YouTubeSearchResult {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { high: { url: string } };
    channelTitle: string;
    publishedAt: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured');
    }

    const { animeIds, forceUpdate = false } = await req.json();
    
    console.log(`Starting auto-trailer detection for ${animeIds?.length || 'all'} anime titles`);

    // Get anime that need trailer detection
    let query = supabase
      .from('anime')
      .select('id, title, title_english, title_japanese, trailer_id, trailer_url');

    if (animeIds && animeIds.length > 0) {
      query = query.in('id', animeIds);
    } else if (!forceUpdate) {
      // Only get anime without trailers
      query = query.is('trailer_id', null);
    }

    const { data: animeList, error: fetchError } = await query.limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch anime: ${fetchError.message}`);
    }

    if (!animeList || animeList.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No anime found that need trailer detection',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const anime of animeList) {
      try {
        // Create search query with multiple title variations
        const searchQueries = [
          `${anime.title} trailer anime`,
          anime.title_english ? `${anime.title_english} trailer anime` : null,
          anime.title_japanese ? `${anime.title_japanese} trailer anime` : null,
        ].filter(Boolean);

        let bestTrailer: YouTubeSearchResult | null = null;
        
        // Try each search query
        for (const searchQuery of searchQueries) {
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery!)}&type=video&maxResults=3&key=${youtubeApiKey}`;
          
          const response = await fetch(searchUrl);
          if (!response.ok) {
            console.error(`YouTube API error for "${anime.title}": ${response.status}`);
            continue;
          }

          const data = await response.json();
          const items = data.items || [];

          // Find the best trailer (prefer official channels and trailer keywords)
          for (const item of items) {
            const title = item.snippet.title.toLowerCase();
            const channel = item.snippet.channelTitle.toLowerCase();
            
            // Score based on various factors
            let score = 0;
            if (title.includes('trailer')) score += 10;
            if (title.includes('official')) score += 5;
            if (title.includes('pv')) score += 8; // Promotional Video
            if (title.includes('anime')) score += 3;
            if (channel.includes('official')) score += 5;
            if (channel.includes('anime')) score += 3;
            
            // Prefer newer videos
            const publishDate = new Date(item.snippet.publishedAt);
            const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSincePublish < 365) score += 2; // Boost recent videos

            if (!bestTrailer || score > 0) {
              bestTrailer = item;
              if (score >= 15) break; // Good enough, stop searching
            }
          }

          if (bestTrailer) break; // Found a good trailer, stop trying other queries
        }

        if (bestTrailer) {
          // Update anime with trailer information
          const { error: updateError } = await supabase
            .from('anime')
            .update({
              trailer_id: bestTrailer.id.videoId,
              trailer_url: `https://www.youtube.com/watch?v=${bestTrailer.id.videoId}`,
              trailer_site: 'YouTube',
              updated_at: new Date().toISOString()
            })
            .eq('id', anime.id);

          if (updateError) {
            console.error(`Failed to update anime ${anime.title}:`, updateError);
            errors++;
          } else {
            console.log(`✅ Found trailer for "${anime.title}": ${bestTrailer.snippet.title}`);
            updated++;
          }
        } else {
          console.log(`❌ No trailer found for "${anime.title}"`);
        }

        processed++;

        // Add delay to respect YouTube API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error(`Error processing anime "${anime.title}":`, error);
        errors++;
        processed++;
      }
    }

    console.log(`Auto-trailer detection completed: ${processed} processed, ${updated} updated, ${errors} errors`);

    return new Response(JSON.stringify({
      success: true,
      processed,
      updated,
      errors,
      message: `Processed ${processed} anime titles, found trailers for ${updated}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Auto-trailer detection error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});