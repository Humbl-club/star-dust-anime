import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LootBoxRequest {
  userId: string;
  boxType: 'standard' | 'premium' | 'ultra';
  clientSeed?: string;
}

interface LootBoxResult {
  username: string;
  tier: 'GOD' | 'LEGENDARY' | 'EPIC' | 'RARE' | 'UNCOMMON' | 'COMMON';
  serverSeed: string;
  nonce: number;
  hash: string;
  sourceAnime?: string;
  description?: string;
  personality?: string;
  isFirstTime?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, boxType, clientSeed } = await req.json() as LootBoxRequest;

    console.log(`Opening ${boxType} loot box for user ${userId}`);

    // Check if this is the user's first loot box
    const { data: isFirstData, error: firstError } = await supabase
      .rpc('is_first_loot_box', { user_id_param: userId });

    console.log(`Is first loot box: ${!isFirstData}`);
    let isFirstTime = !isFirstData;

    // Verify user has the loot box
    const { data: boxData, error: boxError } = await supabase
      .from('user_loot_boxes')
      .select('quantity')
      .eq('user_id', userId)
      .eq('box_type', boxType)
      .single();

    if (boxError || !boxData || boxData.quantity <= 0) {
      throw new Error('No loot boxes available');
    }

    // Generate cryptographically secure server seed
    const serverSeed = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create nonce (timestamp + random)
    const nonce = Date.now() + Math.floor(Math.random() * 1000);

    // Create hash for provably fair system
    const combinedSeed = `${serverSeed}-${clientSeed || 'default'}-${nonce}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(combinedSeed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Use first 8 chars of hash to determine outcome (provably fair)
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const random = hashInt / 0xffffffff; // Normalize to 0-1

    console.log(`Provably fair random: ${random} (hash: ${hash.substring(0, 16)}...)`);

    // Determine tier based on box type and random value
    let targetTier: string;
    if (boxType === 'ultra') {
      if (random <= 0.001) targetTier = 'GOD';
      else if (random <= 0.01) targetTier = 'LEGENDARY';
      else if (random <= 0.1) targetTier = 'EPIC';
      else if (random <= 0.3) targetTier = 'RARE';
      else if (random <= 0.6) targetTier = 'UNCOMMON';
      else targetTier = 'COMMON';
    } else if (boxType === 'premium') {
      if (random <= 0.0005) targetTier = 'GOD';
      else if (random <= 0.005) targetTier = 'LEGENDARY';
      else if (random <= 0.08) targetTier = 'EPIC';
      else if (random <= 0.25) targetTier = 'RARE';
      else if (random <= 0.5) targetTier = 'UNCOMMON';
      else targetTier = 'COMMON';
    } else {
      if (random <= 0.0001) targetTier = 'GOD';
      else if (random <= 0.005) targetTier = 'LEGENDARY';
      else if (random <= 0.05) targetTier = 'EPIC';
      else if (random <= 0.2) targetTier = 'RARE';
      else if (random <= 0.5) targetTier = 'UNCOMMON';
      else targetTier = 'COMMON';
    }

    console.log(`Selected tier: ${targetTier}`);

    // Get random username from pool for this tier with character data
    const { data: usernameData, error: usernameError } = await supabase
      .from('username_pool')
      .select('name, tier, source_anime, character_description, character_personality')
      .eq('tier', targetTier)
      .order('random()')
      .limit(1)
      .single();

    if (usernameError) {
      console.error('Username fetch error:', usernameError);
      throw usernameError;
    }

    // Consume the loot box
    const { error: consumeError } = await supabase
      .from('user_loot_boxes')
      .update({ quantity: boxData.quantity - 1 })
      .eq('user_id', userId)
      .eq('box_type', boxType);

    if (consumeError) {
      console.error('Consume error:', consumeError);
      throw consumeError;
    }

    // Add to username history
    const { error: historyError } = await supabase
      .from('username_history')
      .insert({
        user_id: userId,
        username: usernameData.name,
        tier: usernameData.tier,
        acquired_method: 'loot_box'
      });

    if (historyError) {
      console.error('History error:', historyError);
      throw historyError;
    }

    // Mark first loot box as opened if this was their first time
    if (isFirstTime) {
      const { error: markError } = await supabase
        .rpc('mark_first_loot_box_opened', { user_id_param: userId });
      
      if (markError) {
        console.error('Mark first loot box error:', markError);
      } else {
        console.log('Marked first loot box as opened');
      }
    }

    // Log the opening for audit trail
    const { error: auditError } = await supabase
      .from('daily_activities')
      .insert({
        user_id: userId,
        activity_type: 'loot_box_opened',
        points_earned: 0,
        metadata: {
          box_type: boxType,
          username_obtained: usernameData.name,
          tier: usernameData.tier,
          server_seed: serverSeed,
          client_seed: clientSeed,
          nonce: nonce,
          hash: hash.substring(0, 16),
          random_value: random,
          is_first_time: isFirstTime
        }
      });

    if (auditError) {
      console.error('Audit error:', auditError);
    }

    const result: LootBoxResult = {
      username: usernameData.name,
      tier: usernameData.tier as any,
      serverSeed,
      nonce,
      hash: hash.substring(0, 16),
      sourceAnime: usernameData.source_anime,
      description: usernameData.character_description,
      personality: usernameData.character_personality,
      isFirstTime
    };

    console.log(`Loot box opened successfully:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Loot box opening error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});