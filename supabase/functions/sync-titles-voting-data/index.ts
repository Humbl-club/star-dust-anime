

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
    console.log('🎯 Starting num_users_voted sync for titles with scores...');

    const { batchSize = 50 } = await req.json().catch(() => ({}));
    
    const startTime = Date.now();
    let totalUpdated = 0;
    let totalProcessed = 0;
    const errors: string[] = [];

    // Get all titles that have a score (not null)
    console.log('📋 Fetching titles with scores...');
    const { data: titlesWithScores, error: fetchError } = await supabase
      .from('titles')
      .select('id, anilist_id, title')
      .not('score', 'is', null)
      .order('anilist_id');

    if (fetchError) {
      throw new Error(`Failed to fetch titles: ${fetchError.message}`);
    }

    if (!titlesWithScores?.length) {
      console.log('⚠️ No titles with scores found');
      return new Response(JSON.stringify({
        success: true,
        total_updated: 0,
        total_processed: 0,
        message: 'No titles with scores found',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Found ${titlesWithScores.length} titles with scores to process`);

    // Process titles in batches
    for (let i = 0; i < titlesWithScores.length; i += batchSize) {
      const batch = titlesWithScores.slice(i, i + batchSize);
      console.log(`📄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(titlesWithScores.length / batchSize)} (${batch.length} titles)...`);

      let batchUpdated = 0;

      for (const title of batch) {
        try {
          totalProcessed++;
          
          // Fetch voting data from AniList for this specific title
          const votingData = await fetchAniListVotingDataById(title.anilist_id);
          
          if (votingData?.stats?.scoreDistribution) {
            const numUsersVoted = votingData.stats.scoreDistribution.reduce(
              (total: number, dist: any) => total + (dist.amount || 0), 
              0
            ) || 0;

            // Update the title with voting data
            const { error: updateError } = await supabase
              .from('titles')
              .update({
                num_users_voted: numUsersVoted
              })
              .eq('id', title.id);

            if (updateError) {
              console.error(`❌ Failed to update title ${title.anilist_id} (${title.title}):`, updateError);
              errors.push(`Title ${title.anilist_id}: ${updateError.message}`);
            } else {
              console.log(`✅ Updated num_users_voted for ${title.title} (${title.anilist_id}): voted=${numUsersVoted}`);
              batchUpdated++;
              totalUpdated++;
            }
          } else {
            console.log(`⚠️ No voting data found for title ${title.anilist_id} (${title.title})`);
          }

          // Rate limiting: small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (itemError) {
          console.error(`❌ Error processing title ${title.anilist_id} (${title.title}):`, itemError);
          errors.push(`Title ${title.anilist_id}: ${itemError.message}`);
        }
      }

      console.log(`✅ Batch completed: ${batchUpdated}/${batch.length} titles updated`);
      
      // Longer delay between batches
      if (i + batchSize < titlesWithScores.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;

    await supabase.from('cron_job_logs').insert({
      job_name: 'sync-titles-voting-data',
      status: errors.length > 0 ? 'partial_success' : 'success',
      details: {
        total_updated: totalUpdated,
        total_processed: totalProcessed,
        titles_with_scores: titlesWithScores.length,
        batch_size: batchSize,
        duration_ms: duration,
        errors: errors.slice(0, 10)
      },
      error_message: errors.length > 0 ? errors.join('; ') : null
    });

    return new Response(JSON.stringify({
      success: true,
      total_updated: totalUpdated,
      total_processed: totalProcessed,
      titles_with_scores: titlesWithScores.length,
      batch_size: batchSize,
      duration: `${duration}ms`,
      errors: errors.slice(0, 10),
      message: `Successfully updated num_users_voted for ${totalUpdated} out of ${totalProcessed} titles`,
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

async function fetchAniListVotingDataById(anilistId: number) {
  const query = `
    query ($id: Int) {
      Media(id: $id) {
        id
        stats {
          scoreDistribution {
            amount
          }
        }
      }
    }
  `;

  const variables = {
    id: anilistId
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
    throw new Error(`AniList API error for ID ${anilistId}: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`AniList GraphQL error for ID ${anilistId}: ${data.errors[0]?.message || 'Unknown GraphQL error'}`);
  }
  
  return data.data?.Media;
}

