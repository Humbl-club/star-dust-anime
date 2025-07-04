interface YouTubeSearchResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

interface YouTubeVideoDetails {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      maxres?: { url: string };
      high: { url: string };
      medium: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
  };
}

class YouTubeService {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  async searchTrailers(query: string, maxResults = 5): Promise<YouTubeSearchResult[]> {
    try {
      const searchQuery = `${query} trailer anime`;
      const response = await fetch(
        `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=${maxResults}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }

  async getVideoDetails(videoId: string): Promise<YouTubeVideoDetails | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/videos?part=snippet,statistics&id=${videoId}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      console.error('YouTube video details error:', error);
      return null;
    }
  }

  getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  }

  getThumbnail(videoId: string, quality: 'maxres' | 'high' | 'medium' = 'high'): string {
    return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
  }

  isValidVideoId(videoId: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  }

  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && this.isValidVideoId(match[1])) {
        return match[1];
      }
    }

    return null;
  }
}

export const youtubeService = new YouTubeService();
export type { YouTubeSearchResult, YouTubeVideoDetails };