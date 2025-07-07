import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { SyncResults } from './types.ts'
import { fetchAniListData } from './anilist-api.ts'
import { processSingleItem } from './item-processor.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { contentType, maxPages = 10 } = await req.json()

    console.log(`🚀 Starting comprehensive ${contentType} sync with normalized database schema`)

    if (!contentType || !['anime', 'manga'].includes(contentType)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid contentType. Must be "anime" or "manga"' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const mediaType = contentType.toUpperCase() as 'ANIME' | 'MANGA'
    const startTime = Date.now()
    
    // Initialize comprehensive results tracking
    const results: SyncResults = {
      titlesInserted: 0,
      detailsInserted: 0,
      genresCreated: 0,
      studiosCreated: 0,
      authorsCreated: 0,
      relationshipsCreated: 0,
      errors: []
    }

    let currentPage = 1
    let totalProcessed = 0
    let consecutiveEmptyPages = 0

    console.log(`Processing up to ${maxPages} pages of ${contentType} data...`)

    // Process pages sequentially to avoid overwhelming the database
    while (currentPage <= maxPages && consecutiveEmptyPages < 3) {
      try {
        console.log(`📄 Processing page ${currentPage}/${maxPages}...`)
        
        const response = await fetchAniListData(mediaType, currentPage)
        
        if (!response.data?.Page?.media?.length) {
          console.log(`⚠️ No data found on page ${currentPage}`)
          consecutiveEmptyPages++
          currentPage++
          continue
        }

        const items = response.data.Page.media
        console.log(`📊 Found ${items.length} items on page ${currentPage}`)
        
        // Deduplicate items by anilist_id to prevent "cannot affect row a second time" errors
        const seenIds = new Set<number>()
        const deduplicatedItems = items.filter(item => {
          if (!item.id || seenIds.has(item.id)) {
            console.log(`⚠️ Skipping duplicate or invalid item: ${item.id}`)
            return false
          }
          seenIds.add(item.id)
          return true
        })
        
        console.log(`📊 After deduplication: ${deduplicatedItems.length}/${items.length} items (removed ${items.length - deduplicatedItems.length} duplicates)`)
        
        let pageProcessed = 0
        consecutiveEmptyPages = 0

        // Process each deduplicated item individually for better error handling and tracking
        for (const item of deduplicatedItems) {
          if (!item.id || !item.title?.romaji && !item.title?.english) {
            console.log(`⚠️ Skipping invalid item: ${item.id}`)
            continue
          }

          const itemResult = await processSingleItem(supabase, item, contentType)
          
          if (itemResult.success) {
            if (itemResult.titleProcessed) results.titlesInserted++
            if (itemResult.detailProcessed) results.detailsInserted++
            results.genresCreated += itemResult.genresCreated
            results.studiosCreated += itemResult.studiosCreated
            results.authorsCreated += itemResult.authorsCreated
            results.relationshipsCreated += itemResult.relationshipsCreated
            pageProcessed++
            totalProcessed++
          } else {
            results.errors.push(`Page ${currentPage}, Item ${item.id}: ${itemResult.error}`)
            console.error(`❌ Failed to process item ${item.id}:`, itemResult.error)
          }

          // Add small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        console.log(`✅ Page ${currentPage} completed: ${pageProcessed}/${deduplicatedItems.length} items processed successfully`)
        
        // Add delay between pages to respect AniList rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`❌ Error processing page ${currentPage}:`, error)
        results.errors.push(`Page ${currentPage}: ${error.message}`)
        consecutiveEmptyPages++
      }

      currentPage++
    }

    const duration = Date.now() - startTime
    const avgPerSecond = duration > 0 ? Math.round((totalProcessed / duration) * 1000) : 0

    console.log(`🎉 Sync completed in ${duration}ms:`)
    console.log(`   📊 Total processed: ${totalProcessed}`)
    console.log(`   📖 Titles: ${results.titlesInserted}`)
    console.log(`   📝 Details: ${results.detailsInserted}`)
    console.log(`   🎭 Genres: ${results.genresCreated}`)
    console.log(`   🏢 Studios: ${results.studiosCreated}`)
    console.log(`   ✍️ Authors: ${results.authorsCreated}`)
    console.log(`   🔗 Relationships: ${results.relationshipsCreated}`)
    console.log(`   ❌ Errors: ${results.errors.length}`)

    // Return comprehensive results
    return new Response(
      JSON.stringify({
        success: true,
        contentType,
        totalProcessed,
        pagesProcessed: currentPage - 1,
        duration: `${duration}ms`,
        averagePerSecond: avgPerSecond,
        results: {
          titlesInserted: results.titlesInserted,
          detailsInserted: results.detailsInserted,
          genresCreated: results.genresCreated,
          studiosCreated: results.studiosCreated,
          authorsCreated: results.authorsCreated,
          relationshipsCreated: results.relationshipsCreated,
          errors: results.errors.slice(0, 10) // Limit error details
        },
        message: `Successfully synced ${totalProcessed} ${contentType} items with ${results.relationshipsCreated} relationships`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Ultra-fast sync critical error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Ultra-fast sync failed',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})