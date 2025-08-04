import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StreamingPlatform {
  name: string;
  url: string;
  type: 'subscription' | 'rent' | 'buy';
  price?: string;
  quality?: 'HD' | '4K';
  region: string;
}

interface StreamingResponse {
  available: boolean;
  platforms: StreamingPlatform[];
  lastChecked: string;
  dataSource: 'anilist' | 'justwatch' | 'webscrape';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { titleId, titleName, region = 'US' } = await req.json();

    if (!titleId || !titleName) {
      return new Response(
        JSON.stringify({ error: 'titleId and titleName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check
    const clientIp = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown';
    const rateLimitCheck = await supabaseClient.rpc('check_rate_limit', {
      user_id_param: clientIp,
      resource_type_param: 'streaming_check',
      max_requests: 100,
      window_minutes: 60
    });

    if (rateLimitCheck.data && !rateLimitCheck.data.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          resetTime: rateLimitCheck.data.reset_time 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const { data: cachedData } = await supabaseClient
      .from('streaming_availability_cache')
      .select('*')
      .eq('title_id', titleId)
      .eq('region', region)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedData) {
      console.log(`✅ Cache hit for ${titleName} in ${region}`);
      return new Response(
        JSON.stringify({
          available: cachedData.available,
          platforms: cachedData.platforms,
          lastChecked: cachedData.last_checked,
          dataSource: cachedData.data_source
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Cache miss for ${titleName} in ${region}, fetching fresh data`);

    // Step 1: Try to get AniList external links data
    let streamingData: StreamingResponse;
    
    try {
      streamingData = await getAniListStreamingData(supabaseClient, titleId, titleName, region);
      console.log(`📺 AniList data found for ${titleName}`);
    } catch (error) {
      console.log(`❌ AniList lookup failed for ${titleName}:`, error.message);
      // Fallback to basic response
      streamingData = {
        available: false,
        platforms: [],
        lastChecked: new Date().toISOString(),
        dataSource: 'anilist'
      };
    }

    // Cache the result
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (streamingData.available ? 7 : 1)); // 7 days for available, 1 day for unavailable

    await supabaseClient
      .from('streaming_availability_cache')
      .upsert({
        title_id: titleId,
        title_name: titleName,
        region,
        available: streamingData.available,
        platforms: streamingData.platforms,
        data_source: streamingData.dataSource,
        last_checked: streamingData.lastChecked,
        expires_at: expiresAt.toISOString()
      });

    console.log(`💾 Cached streaming data for ${titleName} (expires: ${streamingData.available ? '7 days' : '1 day'})`);

    return new Response(
      JSON.stringify(streamingData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in streaming availability check:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getAniListStreamingData(
  supabaseClient: any,
  titleId: string,
  titleName: string,
  region: string
): Promise<StreamingResponse> {
  // Get title from database with AniList ID
  const { data: titleData } = await supabaseClient
    .from('titles')
    .select('anilist_id, title, title_english')
    .eq('id', titleId)
    .single();

  if (!titleData?.anilist_id) {
    throw new Error('No AniList ID found for this title');
  }

  // Query AniList API for external links
  const anilistQuery = `
    query ($id: Int) {
      Media(id: $id) {
        title {
          romaji
          english
        }
        externalLinks {
          id
          url
          site
          type
          language
        }
      }
    }
  `;

  const anilistResponse = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: anilistQuery,
      variables: { id: titleData.anilist_id }
    })
  });

  if (!anilistResponse.ok) {
    throw new Error('AniList API request failed');
  }

  const anilistData = await anilistResponse.json();
  const externalLinks = anilistData.data?.Media?.externalLinks || [];

  // Map AniList external links to streaming platforms
  const platforms: StreamingPlatform[] = [];
  
  const streamingSites = {
    'Crunchyroll': { type: 'subscription' as const, quality: 'HD' as const },
    'Funimation': { type: 'subscription' as const, quality: 'HD' as const },
    'Hulu': { type: 'subscription' as const, quality: 'HD' as const },
    'Netflix': { type: 'subscription' as const, quality: 'HD' as const },
    'Amazon Prime Video': { type: 'subscription' as const, quality: '4K' as const },
    'VRV': { type: 'subscription' as const, quality: 'HD' as const },
    'Hidive': { type: 'subscription' as const, quality: 'HD' as const },
    'AnimeLab': { type: 'subscription' as const, quality: 'HD' as const },
    'VIZ': { type: 'subscription' as const, quality: 'HD' as const },
    'YouTube': { type: 'rent' as const, quality: 'HD' as const },
  };

  for (const link of externalLinks) {
    if (link.type === 'STREAMING' && streamingSites[link.site]) {
      // Check if this platform is available in the requested region
      const isAvailableInRegion = await checkRegionalAvailability(link.site, region);
      
      if (isAvailableInRegion) {
        platforms.push({
          name: link.site,
          url: link.url,
          type: streamingSites[link.site].type,
          quality: streamingSites[link.site].quality,
          region: region
        });
      }
    }
  }

  return {
    available: platforms.length > 0,
    platforms,
    lastChecked: new Date().toISOString(),
    dataSource: 'anilist'
  };
}

function checkRegionalAvailability(platform: string, region: string): boolean {
  // Basic regional availability mapping
  const regionalAvailability: Record<string, string[]> = {
    'Crunchyroll': ['US', 'CA', 'UK', 'AU', 'FR', 'DE', 'BR'],
    'Funimation': ['US', 'CA', 'UK', 'AU'],
    'Hulu': ['US'],
    'Netflix': ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'BR', 'JP'],
    'Amazon Prime Video': ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'BR', 'JP'],
    'VRV': ['US'],
    'Hidive': ['US', 'CA', 'UK', 'AU'],
    'AnimeLab': ['AU'],
    'VIZ': ['US'],
    'YouTube': ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'BR', 'JP'],
  };

  return regionalAvailability[platform]?.includes(region) ?? false;
}