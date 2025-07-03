import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, contentType = 'anime', limit = 20 } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`AI Search: Processing query "${query}" for ${contentType}`);

    // First, try direct database search
    const { data: directResults, error: directError } = await supabase
      .from(contentType)
      .select('*')
      .or(`title.ilike.%${query}%,title_english.ilike.%${query}%,title_japanese.ilike.%${query}%,synopsis.ilike.%${query}%`)
      .limit(limit);

    if (directError) {
      console.error('Direct search error:', directError);
    }

    // If we have good direct results, return them
    if (directResults && directResults.length >= 3) {
      console.log(`Direct search found ${directResults.length} results`);
      return new Response(
        JSON.stringify({ 
          results: directResults,
          searchType: 'direct',
          originalQuery: query 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If direct search has few results, use AI to enhance the search
    console.log('Using AI to enhance search...');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ 
          results: directResults || [],
          searchType: 'fallback',
          originalQuery: query 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get a sample of titles to help AI understand the database
    const { data: sampleTitles } = await supabase
      .from(contentType)
      .select('title, title_english, title_japanese, genres, synopsis')
      .limit(100);

    const titles = sampleTitles?.map(item => ({
      title: item.title,
      english: item.title_english,
      japanese: item.title_japanese,
      genres: item.genres?.join(', ') || '',
      synopsis: item.synopsis?.substring(0, 200) || ''
    })) || [];

    const aiPrompt = `You are an anime/manga search assistant. A user searched for "${query}". 

Based on this sample of titles in our database:
${titles.slice(0, 20).map(t => `- ${t.title} (EN: ${t.english || 'N/A'}) [${t.genres}]`).join('\n')}

Your task is to:
1. Correct any spelling mistakes in the search query
2. Translate the query if it's in a different language
3. Identify the most relevant search terms and synonyms
4. Consider genre names, character names, or plot elements

Respond with a JSON object containing:
{
  "correctedQuery": "corrected search term",
  "alternativeTerms": ["synonym1", "synonym2", "related_term"],
  "searchStrategy": "explanation of what you think the user is looking for",
  "genres": ["relevant_genre1", "relevant_genre2"] if genre-related
}

Examples:
- "narto" -> {"correctedQuery": "naruto", "alternativeTerms": ["ninja", "shinobi"], "searchStrategy": "Popular ninja anime"}
- "amor anime" -> {"correctedQuery": "romance anime", "alternativeTerms": ["love", "romantic", "shoujo"], "searchStrategy": "Romance genre anime", "genres": ["Romance"]}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful anime/manga search assistant. Always respond with valid JSON.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.3,
      }),
    });

    const aiData = await aiResponse.json();
    const aiSuggestion = JSON.parse(aiData.choices[0].message.content);
    
    console.log('AI suggestion:', aiSuggestion);

    // Build enhanced search terms
    const searchTerms = [
      aiSuggestion.correctedQuery,
      ...(aiSuggestion.alternativeTerms || []),
      query // Keep original as fallback
    ].filter(Boolean);

    // Search with enhanced terms
    let enhancedResults = [];
    
    for (const term of searchTerms) {
      const { data: termResults } = await supabase
        .from(contentType)
        .select('*')
        .or(`title.ilike.%${term}%,title_english.ilike.%${term}%,title_japanese.ilike.%${term}%,synopsis.ilike.%${term}%,genres.cs.{${term}}`)
        .limit(limit);
      
      if (termResults && termResults.length > 0) {
        enhancedResults.push(...termResults);
      }
    }

    // Remove duplicates
    const uniqueResults = enhancedResults.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    ).slice(0, limit);

    // If we still have few results, try genre-based search
    if (uniqueResults.length < 5 && aiSuggestion.genres) {
      for (const genre of aiSuggestion.genres) {
        const { data: genreResults } = await supabase
          .from(contentType)
          .select('*')
          .contains('genres', [genre])
          .limit(10);
        
        if (genreResults) {
          uniqueResults.push(...genreResults.filter(item => 
            !uniqueResults.some(existing => existing.id === item.id)
          ));
        }
      }
    }

    console.log(`AI-enhanced search found ${uniqueResults.length} results`);

    return new Response(
      JSON.stringify({ 
        results: uniqueResults.slice(0, limit),
        searchType: 'ai-enhanced',
        originalQuery: query,
        aiSuggestion: aiSuggestion,
        searchTermsUsed: searchTerms
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI search:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Search failed',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});