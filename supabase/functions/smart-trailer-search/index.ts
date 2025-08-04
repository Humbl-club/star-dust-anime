import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrailerResult {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  type: 'official' | 'review' | 'explanation';
  youtuber?: string;
}

const POPULAR_ANIME_YOUTUBERS = [
  'Gigguk',
  'The Anime Man',
  'Trash Taste',
  'AnimeMan',
  'Mother\'s Basement',
  'PrettyMuchIt',
  'Glass Reflection',
  'Super Eyepatch Wolf',
  'Scamboli Reviews',
  'Replay Value'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { animeTitle, maxResults = 6 } = await req.json();
    
    if (!animeTitle) {
      throw new Error('Anime title is required');
    }

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured');
    }

    console.log(`🔍 Searching for trailers for: ${animeTitle}`);

    const results: TrailerResult[] = [];

    // 1. Search for official trailers first
    const officialQueries = [
      `${animeTitle} official trailer`,
      `${animeTitle} PV trailer`,
      `${animeTitle} anime trailer`,
      `${animeTitle} promotional video`
    ];

    for (const query of officialQueries) {
      if (results.length >= maxResults) break;
      
      console.log(`🎬 Searching official: ${query}`);
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=3&key=${youtubeApiKey}&order=relevance`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) continue;
      
      const data = await response.json();
      
      for (const item of data.items || []) {
        if (results.length >= maxResults) break;
        
        const title = item.snippet.title.toLowerCase();
        const channel = item.snippet.channelTitle.toLowerCase();
        
        // Check if it's likely an official trailer
        const isOfficial = (
          title.includes('trailer') || 
          title.includes('pv') || 
          title.includes('promotional') ||
          channel.includes('official') ||
          channel.includes('anime') ||
          channel.includes('studio')
        );
        
        if (isOfficial) {
          results.push({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            type: 'official'
          });
          console.log(`✅ Found official trailer: ${item.snippet.title}`);
        }
      }
    }

    // 2. If we don't have enough results, search for YouTuber reviews/explanations
    if (results.length < 3) {
      console.log(`🎭 Searching for YouTuber content (current results: ${results.length})`);
      
      for (const youtuber of POPULAR_ANIME_YOUTUBERS) {
        if (results.length >= maxResults) break;
        
        const youtuberQueries = [
          `${youtuber} ${animeTitle} review`,
          `${youtuber} ${animeTitle} analysis`,
          `${youtuber} ${animeTitle} explained`,
          `${youtuber} ${animeTitle}`
        ];
        
        for (const query of youtuberQueries) {
          if (results.length >= maxResults) break;
          
          console.log(`🎪 Searching: ${query}`);
          
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=2&key=${youtubeApiKey}&order=relevance`;
          
          const response = await fetch(searchUrl);
          if (!response.ok) continue;
          
          const data = await response.json();
          
          for (const item of data.items || []) {
            if (results.length >= maxResults) break;
            
            const title = item.snippet.title.toLowerCase();
            const channel = item.snippet.channelTitle.toLowerCase();
            const animeTitleLower = animeTitle.toLowerCase();
            
            // Check if the video is about the anime and from the expected YouTuber
            const isRelevant = (
              title.includes(animeTitleLower) ||
              item.snippet.description.toLowerCase().includes(animeTitleLower)
            ) && channel.includes(youtuber.toLowerCase());
            
            // Skip if we already have this video
            const alreadyExists = results.some(r => r.videoId === item.id.videoId);
            
            if (isRelevant && !alreadyExists) {
              const type = title.includes('review') ? 'review' : 'explanation';
              
              results.push({
                videoId: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                type,
                youtuber
              });
              console.log(`🎬 Found ${type}: ${item.snippet.title} by ${youtuber}`);
              break; // Move to next YouTuber
            }
          }
        }
      }
    }

    // 3. Final fallback: general search if still not enough results
    if (results.length < 2) {
      console.log(`🔄 Final fallback search (current results: ${results.length})`);
      
      const fallbackQuery = `${animeTitle} anime`;
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(fallbackQuery)}&type=video&maxResults=5&key=${youtubeApiKey}&order=relevance`;
      
      const response = await fetch(searchUrl);
      if (response.ok) {
        const data = await response.json();
        
        for (const item of data.items || []) {
          if (results.length >= maxResults) break;
          
          const alreadyExists = results.some(r => r.videoId === item.id.videoId);
          
          if (!alreadyExists) {
            results.push({
              videoId: item.id.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
              channelTitle: item.snippet.channelTitle,
              publishedAt: item.snippet.publishedAt,
              type: 'explanation'
            });
          }
        }
      }
    }

    console.log(`📊 Final results: ${results.length} videos found`);
    console.log(`   Official trailers: ${results.filter(r => r.type === 'official').length}`);
    console.log(`   Reviews: ${results.filter(r => r.type === 'review').length}`);
    console.log(`   Explanations: ${results.filter(r => r.type === 'explanation').length}`);

    return new Response(JSON.stringify({
      success: true,
      animeTitle,
      results: results.slice(0, maxResults),
      totalFound: results.length,
      breakdown: {
        official: results.filter(r => r.type === 'official').length,
        review: results.filter(r => r.type === 'review').length,
        explanation: results.filter(r => r.type === 'explanation').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Smart trailer search error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});