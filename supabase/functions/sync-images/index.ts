import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, limit = 10 } = await req.json();
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Starting image sync for ${type}, limit: ${limit}`);

    // Get items without cached images
    const { data: items, error: fetchError } = await supabase
      .from(type === 'anime' ? 'anime' : 'manga')
      .select('id, title, image_url, mal_id')
      .not('image_url', 'like', '%supabase%') // Only items not already cached
      .limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No items need image caching',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${items.length} items that need image caching`);

    let processed = 0;
    const bucketName = type === 'anime' ? 'anime-images' : 'manga-images';

    for (const item of items) {
      try {
        if (!item.image_url) continue;

        console.log(`Processing image for ${item.title} (${item.mal_id})`);

        // Download image
        const imageResponse = await fetch(item.image_url);
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image for ${item.title}: ${imageResponse.status}`);
          continue;
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const fileExtension = item.image_url.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `${item.mal_id}.${fileExtension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, imageBuffer, {
            contentType: `image/${fileExtension}`,
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for ${item.title}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        // Update database with new image URL
        const { error: updateError } = await supabase
          .from(type === 'anime' ? 'anime' : 'manga')
          .update({ image_url: publicUrl })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Database update error for ${item.title}:`, updateError);
          continue;
        }

        processed++;
        console.log(`Successfully cached image for ${item.title}`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing ${item.title}:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed,
      total: items.length,
      bucket: bucketName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-images function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});