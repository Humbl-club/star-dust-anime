export interface AniListResponse {
  data?: {
    Page: {
      media: any[]
      pageInfo: {
        hasNextPage: boolean
        currentPage: number
      }
    }
  }
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
  }>
}

export interface SyncResults {
  titlesInserted: number
  detailsInserted: number
  genresCreated: number
  studiosCreated: number
  authorsCreated: number
  relationshipsCreated: number
  errors: string[]
}

export interface ProcessItemResult {
  success: boolean
  titleProcessed: boolean
  detailProcessed: boolean
  genresCreated: number
  studiosCreated: number
  authorsCreated: number
  relationshipsCreated: number
  error?: string
}