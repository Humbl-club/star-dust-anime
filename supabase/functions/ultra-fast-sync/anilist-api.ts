
import { AniListResponse } from './types.ts'

export async function fetchAniListData(type: 'ANIME' | 'MANGA', page: number = 1): Promise<AniListResponse> {
  const query = `
    query ($page: Int, $perPage: Int, $type: MediaType) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(type: $type, sort: [POPULARITY_DESC, SCORE_DESC]) {
          id
          title {
            romaji
            english
            native
          }
          description
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          season
          seasonYear
          format
          status
          episodes
          chapters
          volumes
          coverImage {
            large
            medium
            color
          }
          genres
          averageScore
          popularity
          favourites
          stats {
            scoreDistribution {
              amount
            }
          }
          studios {
            nodes {
              name
            }
          }
          staff {
            nodes {
              name {
                full
              }
            }
          }
          trailer {
            id
            site
          }
          nextAiringEpisode {
            episode
            airingAt
          }
        }
      }
    }
  `

  const variables = {
    page,
    perPage: 50, // Increased batch size
    type
  }

  try {
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
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`AniList API error ${response.status}:`, errorText)
      throw new Error(`AniList API error: ${response.status} - ${errorText}`)
    }

    const data: AniListResponse = await response.json()
    
    // Check for GraphQL errors in the response
    if (data.errors) {
      console.error('AniList GraphQL errors:', data.errors)
      throw new Error(`AniList GraphQL error: ${data.errors[0]?.message || 'Unknown GraphQL error'}`)
    }
    
    console.log(`✅ Successfully fetched ${data.data?.Page?.media?.length || 0} ${type} items from page ${page}`)
    return data
  } catch (error) {
    console.error(`Error fetching ${type} data from AniList:`, error)
    throw error
  }
}
