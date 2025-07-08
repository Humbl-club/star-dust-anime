import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, tier } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Enhanced prompt based on tier
    const tierPrompts = {
      GOD: "ultra detailed divine anime character, godlike aura, golden light effects, majestic pose, crown or halo, flowing robes, celestial background, masterpiece quality, 8k resolution",
      LEGENDARY: "detailed legendary anime hero, heroic pose, cape flowing, energy effects, determined expression, powerful stance, epic lighting, high quality anime art",
      EPIC: "mystical anime character, magical effects, staff or mystical weapon, enchanted clothing, mysterious aura, detailed character design",
      RARE: "skilled anime warrior, combat gear, weapon, confident pose, detailed armor or outfit, professional anime art style",
      UNCOMMON: "anime student or apprentice character, books or learning tools, eager expression, school or academy setting, clean anime style",
      COMMON: "simple anime character, casual clothing, friendly expression, basic but well-drawn, standard anime art style"
    };

    const enhancedPrompt = `${prompt}, ${tierPrompts[tier as keyof typeof tierPrompts] || tierPrompts.COMMON}, anime style, detailed character design, high quality`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'png'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // gpt-image-1 returns base64 data directly
    const imageData = data.data[0];
    
    return new Response(JSON.stringify({ 
      image_url: `data:image/png;base64,${imageData.b64_json || imageData.image}`,
      prompt: enhancedPrompt 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-character-image function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: true 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});