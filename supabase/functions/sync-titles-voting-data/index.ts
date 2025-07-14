
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
    console.log('🎯 Starting num_users_voted sync for titles...');

    const { maxPages = 5, contentType = 'both' } = await req.json().catch(() => ({}));
    
    const startTime = Date.now();
    let totalUpdated = 0;
    let currentPage = 1;
    const errors: string[] = [];

    // Determine which content types to sync
    const contentTypes = contentType === 'both' ? ['anime', 'manga'] : [contentType];

    for (const type of contentTypes) {
      console.log(`📋 Processing ${type} titles...`);
      currentPage = 1;

      while (currentPage <= maxPages) {
        try {
          console.log(`📄 Processing ${type} page ${currentPage}/${maxPages}...`);
          
          const response = await fetchAniListVotingData(currentPage, type);
          
          if (!response.data?.Page?.media?.length) {
            console.log(`⚠️ No ${type} data found on page ${currentPage}`);
            break;
          }

          const items = response.data.Page.media;
          console.log(`📊 Found ${items.length} ${type} items on page ${currentPage}`);
          
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
                  console.error(`❌ Failed to update ${type} item ${item.id}:`, updateError);
                  errors.push(`${type} ${item.id}: ${updateError.message}`);
                } else {
                  console.log(`✅ Updated num_users_voted for ${type} ${item.id}: voted=${numUsersVoted}`);
                  pageUpdated++;
                  totalUpdated++;
                }
              }

              await new Promise(resolve => setTimeout(resolve, 50));

            } catch (itemError) {
              console.error(`❌ Error processing ${type} item ${item.id}:`, itemError);
              errors.push(`${type} ${item.id}: ${itemError.message}`);
            }
          }

          console.log(`✅ ${type} page ${currentPage} completed: ${pageUpdated}/${items.length} items updated`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (pageError) {
          console.error(`❌ Error processing ${type} page ${currentPage}:`, pageError);
          errors.push(`${type} page ${currentPage}: ${pageError.message}`);
        }

        currentPage++;
      }
    }

    const duration = Date.now() - startTime;

    await supabase.from('cron_job_logs').insert({
      job_name: 'sync-titles-voting-data',
      status: errors.length > 0 ? 'partial_success' : 'success',
      details: {
        total_updated: totalUpdated,
        content_types: contentTypes,
        pages_processed_per_type: currentPage - 1,
        duration_ms: duration,
        errors: errors.slice(0, 10)
      },
      error_message: errors.length > 0 ? errors.join('; ') : null
    });

    return new Response(JSON.stringify({
      success: true,
      total_updated: totalUpdated,
      content_types: contentTypes,
      pages_processed_per_type: currentPage - 1,
      duration: `${duration}ms`,
      errors: errors.slice(0, 10),
      message: `Successfully updated num_users_voted for ${totalUpdated} titles`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Titles voting sync critical error:', error);

    await supabase.from('cron_job_logs').insert({
      job_name: 'sync-titles-voting-data',
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

async function fetchAniListVotingData(page: number = 1, type: string = 'anime') {
  const mediaType = type.toUpperCase();
  
  const query = `
    query ($page: Int, $perPage: Int, $type: MediaType) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(type: $type, sort: [POPULARITY_DESC]) {
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
    perPage: 50,
    type: mediaType
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
