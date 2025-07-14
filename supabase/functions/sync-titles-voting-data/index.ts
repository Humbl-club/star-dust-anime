
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
    console.log('🎯 Starting comprehensive num_users_voted sync for ALL titles with scores...');

    const { batchSize = 50, apiBatchSize = 25 } = await req.json().catch(() => ({}));
    
    const startTime = Date.now();
    let totalUpdated = 0;
    let totalProcessed = 0;
    let totalApiCalls = 0;
    const errors: string[] = [];

    // First, get the total count of titles with scores and num_users_voted == 0
    console.log('📊 Counting total titles with scores and num_users_voted == 0...');
    const { count: totalTitlesCount, error: countError } = await supabase
      .from('titles')
      .select('*', { count: 'exact', head: true })
      .not('score', 'is', null)
      .eq('num_users_voted', 0);

    if (countError) {
      throw new Error(`Failed to count titles: ${countError.message}`);
    }

    console.log(`📈 Found ${totalTitlesCount} total titles with scores and num_users_voted == 0 to process`);

    // Process all titles in chunks using pagination - NO LIMITS
    let processedCount = 0;
    const pageSize = batchSize * 10; // Fetch larger chunks from DB
    let offset = 0;
    let hasMoreData = true;
    
    while (hasMoreData) {
      console.log(`📄 Fetching titles batch: ${offset + 1} to ${offset + pageSize} of ${totalTitlesCount}`);
      
      // Fetch a chunk of titles - removed any implicit limits
      const { data: titlesBatch, error: fetchError } = await supabase
        .from('titles')
        .select('id, anilist_id, title')
        .not('score', 'is', null)
        .eq('num_users_voted', 0)
        .range(offset, offset + pageSize - 1);

      if (fetchError) {
        console.error(`❌ Failed to fetch titles batch at offset ${offset}:`, fetchError);
        errors.push(`Fetch error at offset ${offset}: ${fetchError.message}`);
        offset += pageSize;
        continue;
      }

      if (!titlesBatch?.length) {
        console.log(`⚠️ No more titles found at offset ${offset}`);
        hasMoreData = false;
        break;
      }

      console.log(`📋 Processing ${titlesBatch.length} titles in current chunk...`);

      // Process this chunk in smaller database batches
      for (let i = 0; i < titlesBatch.length; i += batchSize) {
        const batch = titlesBatch.slice(i, i + batchSize);
        console.log(`📄 Processing database batch ${Math.floor(i / batchSize) + 1} with ${batch.length} titles...`);

        let batchUpdated = 0;

        // Group titles into API batches for AniList calls
        for (let j = 0; j < batch.length; j += apiBatchSize) {
          const apiBatch = batch.slice(j, j + apiBatchSize);
          console.log(`🔗 Making AniList batch API call for ${apiBatch.length} titles...`);

          try {
            totalApiCalls++;
            
            // Fetch voting data from AniList for this batch of titles
            const batchVotingData = await fetchAniListVotingDataBatch(apiBatch.map(t => t.anilist_id));
            
            // Process each title in the API batch
            for (const title of apiBatch) {
              try {
                totalProcessed++;
                
                const votingData = batchVotingData[title.anilist_id];
                
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

              } catch (itemError) {
                console.error(`❌ Error processing title ${title.anilist_id} (${title.title}):`, itemError);
                errors.push(`Title ${title.anilist_id}: ${itemError.message}`);
              }
            }

            // Rate limiting: delay between API batch calls
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (batchError) {
            console.error(`❌ Error processing API batch:`, batchError);
            errors.push(`API batch error: ${batchError.message}`);
          }
        }

        console.log(`✅ Database batch completed: ${batchUpdated}/${batch.length} titles updated`);
        processedCount += batch.length;
        
        // Progress update
        const progressPercent = ((processedCount / totalTitlesCount!) * 100).toFixed(1);
        console.log(`📊 Overall progress: ${processedCount}/${totalTitlesCount} (${progressPercent}%)`);
        
        // Longer delay between database batches
        if (i + batchSize < titlesBatch.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Move to next chunk
      offset += pageSize;
      
      // Check if we've processed all available data
      if (titlesBatch.length < pageSize) {
        hasMoreData = false;
      }

      // Brief pause between chunks
      if (hasMoreData) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const duration = Date.now() - startTime;

    await supabase.from('cron_job_logs').insert({
      job_name: 'sync-titles-voting-data',
      status: errors.length > 0 ? 'partial_success' : 'success',
      details: {
        total_updated: totalUpdated,
        total_processed: totalProcessed,
        total_titles_with_scores: totalTitlesCount,
        database_batch_size: batchSize,
        api_batch_size: apiBatchSize,
        total_api_calls: totalApiCalls,
        duration_ms: duration,
        errors: errors.slice(0, 20)
      },
      error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
    });

    return new Response(JSON.stringify({
      success: true,
      total_updated: totalUpdated,
      total_processed: totalProcessed,
      total_titles_with_scores: totalTitlesCount,
      database_batch_size: batchSize,
      api_batch_size: apiBatchSize,
      total_api_calls: totalApiCalls,
      duration: `${duration}ms`,
      errors: errors.slice(0, 10),
      message: `Successfully updated num_users_voted for ${totalUpdated} out of ${totalProcessed} titles using ${totalApiCalls} API calls`,
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

async function fetchAniListVotingDataBatch(anilistIds: number[]): Promise<Record<number, any>> {
  // Build dynamic GraphQL query with aliases for batch fetching
  const aliases = anilistIds.map((id, index) => 
    `media${index}: Media(id: ${id}) {
      id
      stats {
        scoreDistribution {
          amount
        }
      }
    }`
  ).join('\n');

  const query = `
    query {
      ${aliases}
    }
  `;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AniList API batch error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`AniList GraphQL batch error: ${data.errors[0]?.message || 'Unknown GraphQL error'}`);
  }
  
  // Convert aliased response back to anilist_id indexed object
  const result: Record<number, any> = {};
  
  anilistIds.forEach((anilistId, index) => {
    const aliasKey = `media${index}`;
    const mediaData = data.data?.[aliasKey];
    if (mediaData) {
      result[anilistId] = mediaData;
    }
  });
  
  return result;
}
