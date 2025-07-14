
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Starting num_users_voted sync for anime...');

    const { maxPages = 5 } = await req.json().catch(() => ({}));
    
    const startTime = Date.now();
    let totalUpdated = 0;
    let currentPage = 1;
    const errors: string[] = [];

    while (currentPage <= maxPages) {
      try {
        console.log(`📄 Processing page ${currentPage}/${maxPages}...`);
        
        const response = await fetchAniListVotingData(currentPage);
        
        if (!response.data?.Page?.media?.length) {
          console.log(`⚠️ No data found on page ${currentPage}`);
          break;
        }

        const items = response.data.Page.media;
        console.log(`📊 Found ${items.length} items on page ${currentPage}`);
        
        let pageUpdated = 0;

        for (const item of items) {
          if (!item.id) continue;

          try {
            const { data: existingTitle } = await supabase
              .from('titles')
              .select('id, anilist_id')
              .eq('anilist_id', item.id)
              .single();

            if (existingTitle) {
              const numUsersVoted = item.stats?.scoreDistribution?.reduce(
                (total: number, dist: any) => total + (dist.amount || 0), 
                0
              ) || 0;

              const { error: updateError } = await supabase
                .from('titles')
                .update({
                  num_users_voted: numUsersVoted
                })
                .eq('anilist_id', item.id);

              if (updateError) {
                console.error(`❌ Failed to update item ${item.id}:`, updateError);
                errors.push(`Item ${item.id}: ${updateError.message}`);
              } else {
                console.log(`✅ Updated num_users_voted for ${item.id}: voted=${numUsersVoted}`);
                pageUpdated++;
                totalUpdated++;
              }
            }

            await new Promise(resolve => setTimeout(resolve, 50));

          } catch (itemError) {
            console.error(`❌ Error processing item ${item.id}:`, itemError);
            errors.push(`Item ${item.id}: ${itemError.message}`);
          }
        }

        console.log(`✅ Page ${currentPage} completed: ${pageUpdated}/${items.length} items updated`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (pageError) {
        console.error(`❌ Error processing page ${currentPage}:`, pageError);
        errors.push(`Page ${currentPage}: ${pageError.message}`);
      }

      currentPage++;
    }

    const duration = Date.now() - startTime;

    await supabase.from('cron_job_logs').insert({
      job_name: 'sync-anime-voting-data',
      status: errors.length > 0 ? 'partial_success' : 'success',
      details: {
        total_updated: totalUpdated,
        pages_processed: currentPage - 1,
        duration_ms: duration,
        errors: errors.slice(0, 10)
      },
      error_message: errors.length > 0 ? errors.join('; ') : null
    });

    return new Response(JSON.stringify({
      success: true,
      total_updated: totalUpdated,
      pages_processed: currentPage - 1,
      duration: `${duration}ms`,
      errors: errors.slice(0, 10),
      message: `Successfully updated num_users_voted for ${totalUpdated} anime titles`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Anime voting sync critical error:', error);

    await supabase.from('cron_job_logs').insert({
      job_name: 'sync-anime-voting-data',
      status: 'error',
      error_message: error.message,
      details: { error: error.toString() }
    });

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function fetchAniListVotingData(page: number = 1) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(type: ANIME, sort: [POPULARITY_DESC]) {
          id
          stats {
            scoreDistribution {
              amount
            }
          }
        }
      }
    }
  `;

  const variables = {
    page,
    perPage: 50
  };

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AniList API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`AniList GraphQL error: ${data.errors[0]?.message || 'Unknown GraphQL error'}`);
  }
  
  return data;
}
