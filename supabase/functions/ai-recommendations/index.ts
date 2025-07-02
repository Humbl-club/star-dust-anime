import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  userId: string;
  contentType: 'anime' | 'manga';
  count?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, contentType, count = 5 }: RecommendationRequest = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get user's list and preferences
    const { data: userList } = await supabase
      .from(contentType === 'anime' ? 'user_anime_lists' : 'user_manga_lists')
      .select('*')
      .eq('user_id', userId);

    const { data: userPreferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get user's top-rated content for preference analysis
    const topRatedContent = userList
      ?.filter(item => item.score >= 8)
      .slice(0, 10) || [];

    // Get content details for analysis
    let contentDetails = [];
    if (topRatedContent.length > 0) {
      const contentIds = topRatedContent.map(item => 
        contentType === 'anime' ? item.anime_id : item.manga_id
      );
      
      const { data: content } = await supabase
        .from(contentType === 'anime' ? 'anime' : 'manga')
        .select('*')
        .in('id', contentIds);
      
      contentDetails = content || [];
    }

    // Prepare user profile for AI analysis
    const userProfile = {
      totalEntries: userList?.length || 0,
      averageScore: userList?.length > 0 
        ? userList.reduce((sum, item) => sum + (item.score || 0), 0) / userList.length 
        : 0,
      preferredGenres: userPreferences?.preferred_genres || [],
      excludedGenres: userPreferences?.excluded_genres || [],
      topRatedContent: contentDetails.map(item => ({
        title: item.title,
        genres: item.genres,
        score: item.score,
        synopsis: item.synopsis?.substring(0, 200)
      }))
    };

    // Get available content for recommendations
    const { data: availableContent } = await supabase
      .from(contentType === 'anime' ? 'anime' : 'manga')
      .select('id, title, genres, score, synopsis')
      .not('id', 'in', `(${userList?.map(item => 
        contentType === 'anime' ? item.anime_id : item.manga_id
      ).join(',') || 'null'})`)
      .order('score', { ascending: false })
      .limit(50);

    // Generate AI recommendations
    const prompt = `
As an anime/manga recommendation AI, analyze this user's preferences and recommend ${count} ${contentType} titles.

User Profile:
- Total ${contentType} entries: ${userProfile.totalEntries}
- Average rating: ${userProfile.averageScore.toFixed(1)}/10
- Preferred genres: ${userProfile.preferredGenres.join(', ') || 'None specified'}
- Excluded genres: ${userProfile.excludedGenres.join(', ') || 'None specified'}

Top-rated ${contentType} (user's favorites):
${userProfile.topRatedContent.map(item => 
  `- ${item.title} (${item.genres.join(', ')}) - Score: ${item.score}/10`
).join('\n')}

Available ${contentType} to recommend from:
${availableContent?.slice(0, 20).map(item => 
  `- ${item.title} (${item.genres.join(', ')}) - Score: ${item.score}/10`
).join('\n')}

Based on the user's preferences and highly-rated content, recommend ${count} ${contentType} titles that match their taste. For each recommendation, provide:
1. Title (must be from the available list)
2. Confidence score (0.0-1.0)
3. Brief reason (max 50 words)

Format as JSON:
{
  "recommendations": [
    {
      "title": "Title Name",
      "confidence": 0.85,
      "reason": "Brief explanation why this matches user preferences"
    }
  ]
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert anime and manga recommendation engine. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    const aiRecommendations = JSON.parse(aiData.choices[0].message.content);

    // Save recommendations to database
    const recommendationsToSave = [];
    for (const rec of aiRecommendations.recommendations) {
      const matchedContent = availableContent?.find(item => 
        item.title.toLowerCase().includes(rec.title.toLowerCase()) ||
        rec.title.toLowerCase().includes(item.title.toLowerCase())
      );

      if (matchedContent) {
        recommendationsToSave.push({
          user_id: userId,
          [contentType === 'anime' ? 'anime_id' : 'manga_id']: matchedContent.id,
          recommendation_type: 'ai_generated',
          confidence_score: rec.confidence,
          reason: rec.reason
        });
      }
    }

    if (recommendationsToSave.length > 0) {
      await supabase
        .from('recommendations')
        .upsert(recommendationsToSave, { 
          onConflict: `user_id,${contentType}_id`,
          ignoreDuplicates: false 
        });
    }

    return new Response(JSON.stringify({
      success: true,
      recommendations: recommendationsToSave.map(rec => ({
        ...rec,
        content: availableContent?.find(item => item.id === rec[contentType === 'anime' ? 'anime_id' : 'manga_id'])
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-recommendations function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});