// Content Security Policy Implementation

import { generateCSPNonce } from '@/utils/securityUtils';

// CSP configuration
const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'", 
    "'unsafe-inline'", // Temporarily needed for Vite in development
    'https://cdn.jsdelivr.net', // For potential CDN scripts
    'https://unpkg.com' // For potential CDN scripts
  ],
  'style-src': [
    "'self'", 
    "'unsafe-inline'", // Needed for Tailwind and styled components
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'", 
    'data:', 
    'https://fonts.gstatic.com'
  ],
  'img-src': [
    "'self'", 
    'data:', 
    'https:', // Allow HTTPS images
    'cdn.myanimelist.net',
    'img1.ak.crunchyroll.com',
    'image.tmdb.org',
    's4.anilist.co',
    'media.kitsu.io'
  ],
  'connect-src': [
    "'self'",
    'https://axtpbgsjbmhbuqomarcr.supabase.co',
    'wss://axtpbgsjbmhbuqomarcr.supabase.co'
  ],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'media-src': ["'self'", 'data:', 'https:'],
  'worker-src': ["'self'"],
  'child-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'"]
};

// Additional security directives
const SECURITY_DIRECTIVES = [
  'upgrade-insecure-requests'
];

export class ContentSecurityPolicy {
  private static nonce: string = '';
  
  static generateNonce(): string {
    this.nonce = generateCSPNonce();
    return this.nonce;
  }
  
  static getNonce(): string {
    return this.nonce;
  }
  
  static buildCSPHeader(): string {
    const directives: string[] = [];
    
    // Add each CSP directive
    Object.entries(CSP_CONFIG).forEach(([directive, sources]) => {
      let directiveString = `${directive} ${sources.join(' ')}`;
      
      // Add nonce for script-src in production
      if (directive === 'script-src' && import.meta.env.PROD && this.nonce) {
        directiveString += ` 'nonce-${this.nonce}'`;
      }
      
      directives.push(directiveString);
    });
    
    // Add security directives
    directives.push(...SECURITY_DIRECTIVES);
    
    return directives.join('; ');
  }
  
  static applyCSP(): void {
    if (typeof document === 'undefined') return;
    
    // Generate new nonce
    this.generateNonce();
    
    // Remove existing CSP meta tag
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }
    
    // Create new CSP meta tag
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.buildCSPHeader();
    
    // Add to document head
    document.head.appendChild(meta);
    
    console.log('CSP applied:', meta.content);
  }
  
  static applySecurityHeaders(): void {
    if (typeof document === 'undefined') return;
    
    const securityHeaders = [
      {
        name: 'X-Content-Type-Options',
        content: 'nosniff'
      },
      {
        name: 'X-Frame-Options',
        content: 'DENY'
      },
      {
        name: 'X-XSS-Protection',
        content: '1; mode=block'
      },
      {
        name: 'Referrer-Policy',
        content: 'strict-origin-when-cross-origin'
      },
      {
        name: 'Permissions-Policy',
        content: 'camera=(), microphone=(), geolocation=(), payment=()'
      }
    ];
    
    securityHeaders.forEach(({ name, content }) => {
      // Remove existing meta tag
      const existing = document.querySelector(`meta[name="${name}"]`);
      if (existing) {
        existing.remove();
      }
      
      // Create new meta tag
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    });
  }
  
  static validateInlineScript(scriptContent: string): boolean {
    // List of allowed script patterns
    const allowedPatterns = [
      /^console\.(log|warn|error)/,
      /^document\.addEventListener/,
      /^window\.addEventListener/,
      /^import\s+/,
      /^export\s+/
    ];
    
    // Check if script matches allowed patterns
    return allowedPatterns.some(pattern => pattern.test(scriptContent.trim()));
  }
  
  static sanitizeInlineStyle(styleContent: string): string {
    // Remove potentially dangerous CSS
    return styleContent
      .replace(/javascript:/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/behavior\s*:/gi, '')
      .replace(/@import/gi, '')
      .replace(/url\s*\(\s*["']?javascript:/gi, 'url(#');
  }
  
  static isAllowedImageSource(src: string): boolean {
    if (!src) return false;
    
    try {
      const url = new URL(src);
      
      // Check protocol
      if (!['https:', 'http:', 'data:'].includes(url.protocol)) {
        return false;
      }
      
      // Check allowed domains
      const allowedDomains = [
        'cdn.myanimelist.net',
        'img1.ak.crunchyroll.com',
        'image.tmdb.org',
        's4.anilist.co',
        'media.kitsu.io'
      ];
      
      // Allow self-hosted images
      if (url.origin === window.location.origin) {
        return true;
      }
      
      // Allow data URLs
      if (url.protocol === 'data:') {
        return url.href.startsWith('data:image/');
      }
      
      // Check against allowed domains
      return allowedDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return false;
    }
  }
  
  static createSecureImageElement(src: string, alt: string = '', additionalProps: any = {}): HTMLImageElement | null {
    if (!this.isAllowedImageSource(src)) {
      console.warn('CSP: Blocked image from untrusted source:', src);
      return null;
    }
    
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    img.crossOrigin = 'anonymous';
    
    // Apply additional properties
    Object.assign(img, additionalProps);
    
    // Add error handler for failed loads
    img.onerror = () => {
      console.warn('CSP: Failed to load image:', src);
      img.style.display = 'none';
    };
    
    return img;
  }
}

// Initialize CSP on module load
if (import.meta.env.PROD) {
  ContentSecurityPolicy.applyCSP();
  ContentSecurityPolicy.applySecurityHeaders();
}

export default ContentSecurityPolicy;