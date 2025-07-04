interface ShareData {
  title: string;
  text: string;
  url: string;
  image?: string;
}

interface DeepLinkOptions {
  baseUrl?: string;
  includeMetadata?: boolean;
  trackingParams?: Record<string, string>;
}

class DeepLinkingService {
  private baseUrl: string;

  constructor(baseUrl = window.location.origin) {
    this.baseUrl = baseUrl;
  }

  // Generate anime detail deep link
  generateAnimeLink(animeId: string, options: DeepLinkOptions = {}): string {
    const { trackingParams = {} } = options;
    const url = new URL(`${this.baseUrl}/anime/${animeId}`);
    
    Object.entries(trackingParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  // Generate manga detail deep link
  generateMangaLink(mangaId: string, options: DeepLinkOptions = {}): string {
    const { trackingParams = {} } = options;
    const url = new URL(`${this.baseUrl}/manga/${mangaId}`);
    
    Object.entries(trackingParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  // Generate search deep link
  generateSearchLink(query: string, type: 'anime' | 'manga' = 'anime'): string {
    const url = new URL(`${this.baseUrl}/${type}`);
    url.searchParams.set('search', query);
    return url.toString();
  }

  // Generate user list deep link
  generateUserListLink(userId: string, listType: 'anime' | 'manga'): string {
    return `${this.baseUrl}/user/${userId}/${listType}`;
  }

  // Generate social share links
  generateSocialShareLinks(shareData: ShareData) {
    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedTitle = encodeURIComponent(shareData.title);
    const encodedText = encodeURIComponent(shareData.text);

    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      discord: `https://discord.com/channels/@me?text=${encodedText} ${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText} ${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      pinterest: shareData.image 
        ? `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(shareData.image)}&description=${encodedText}`
        : `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`,
    };
  }

  // Native share (Web Share API)
  async nativeShare(shareData: ShareData): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.text,
        url: shareData.url,
      });
      return true;
    } catch (error) {
      console.error('Native share failed:', error);
      return false;
    }
  }

  // Copy to clipboard
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  }

  // Generate QR code URL for sharing
  generateQRCodeUrl(text: string, size = 200): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  }

  // Parse tracking parameters from URL
  parseTrackingParams(): Record<string, string> {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingParams: Record<string, string> = {};

    // Common tracking parameters
    const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'src'];
    
    trackingKeys.forEach(key => {
      const value = urlParams.get(key);
      if (value) {
        trackingParams[key] = value;
      }
    });

    return trackingParams;
  }

  // Generate shareable metadata for anime/manga
  generateShareableMetadata(item: any, type: 'anime' | 'manga') {
    const title = item.title_english || item.title;
    const description = item.synopsis ? 
      `${item.synopsis.substring(0, 150)}...` : 
      `Check out this ${type}: ${title}`;
    
    return {
      title: `${title} - AniVault`,
      description,
      image: item.image_url || item.cover_image_large,
      url: type === 'anime' ? 
        this.generateAnimeLink(item.id) : 
        this.generateMangaLink(item.id),
      type: 'website',
      siteName: 'AniVault',
    };
  }

  // Track link clicks for analytics
  trackLinkClick(linkType: string, targetId: string, source?: string) {
    // This would integrate with your analytics service
    console.log('Link clicked:', { linkType, targetId, source, timestamp: Date.now() });
    
    // Example: Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'link_click', {
        link_type: linkType,
        target_id: targetId,
        source: source || 'unknown',
      });
    }
  }

  // Generate URL with analytics tracking
  generateTrackedLink(baseLink: string, source: string, campaign?: string): string {
    const url = new URL(baseLink);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', 'web');
    
    if (campaign) {
      url.searchParams.set('utm_campaign', campaign);
    }
    
    url.searchParams.set('utm_content', 'deep_link');
    url.searchParams.set('ref', 'anivault');
    
    return url.toString();
  }
}

export const deepLinkingService = new DeepLinkingService();
export type { ShareData, DeepLinkOptions };