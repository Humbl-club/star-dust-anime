// Enhanced Security Utilities for Input Validation, XSS Prevention, and Data Protection

import DOMPurify from 'dompurify';
import { z } from 'zod';

// Configuration for DOMPurify
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  FORCE_BODY: false,
  USE_PROFILES: {
    html: false,
    svg: false,
    svgFilters: false,
    mathMl: false
  }
};

// Enhanced input sanitization with XSS prevention
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove all HTML/script tags and potentially dangerous characters
  let sanitized = input
    .trim()
    .replace(/[<>'"]/g, '') // Remove HTML brackets and quotes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
  
  // Additional cleaning for potential script injection
  sanitized = sanitized.replace(/(\b)(on\S+)(\s*)=|javascript:|data:|vbscript:/gi, '');
  
  return sanitized;
};

// Enhanced HTML content sanitization
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  // Use DOMPurify for comprehensive HTML sanitization
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
};

// Sanitize markdown content while preserving basic formatting
export const sanitizeMarkdown = (markdown: string): string => {
  if (!markdown || typeof markdown !== 'string') return '';
  
  // Remove potentially dangerous markdown patterns
  let sanitized = markdown
    .replace(/\[([^\]]*)\]\((javascript:|data:|vbscript:)[^)]*\)/gi, '[$1](#)') // Remove dangerous links
    .replace(/!\[([^\]]*)\]\((javascript:|data:|vbscript:)[^)]*\)/gi, '') // Remove dangerous images
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ''); // Remove iframe tags
  
  return sanitized;
};

// URL validation and sanitization
export const validateAndSanitizeUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Remove potentially dangerous protocols
    if (url.match(/^(javascript:|data:|vbscript:|file:|ftp:)/i)) {
      return null;
    }
    
    // Ensure HTTPS for external URLs
    if (url.startsWith('http://') && !url.includes('localhost')) {
      url = url.replace('http://', 'https://');
    }
    
    // Validate URL format
    const urlObj = new URL(url);
    
    // Allow only safe protocols
    const allowedProtocols = ['https:', 'http:', 'mailto:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
};

// Image URL validation for safe loading
export const validateImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    
    // Check for safe protocols
    if (!['https:', 'http:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Check for image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const hasImageExtension = imageExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    );
    
    // Check for trusted image domains
    const trustedDomains = [
      'cdn.myanimelist.net',
      'img1.ak.crunchyroll.com',
      'image.tmdb.org',
      's4.anilist.co',
      'media.kitsu.io'
    ];
    
    const isTrustedDomain = trustedDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );
    
    return hasImageExtension || isTrustedDomain;
  } catch {
    return false;
  }
};

// Enhanced form validation with security checks
export const validateFormData = <T>(data: unknown, schema: z.ZodSchema<T>): { 
  isValid: boolean; 
  data?: T; 
  errors: string[] 
} => {
  try {
    const validatedData = schema.parse(data);
    return { isValid: true, data: validatedData, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

// Sanitize all URL parameters
export const sanitizeUrlParams = (params: URLSearchParams): URLSearchParams => {
  const sanitized = new URLSearchParams();
  
  for (const [key, value] of params.entries()) {
    const sanitizedKey = sanitizeInput(key);
    const sanitizedValue = sanitizeInput(value);
    
    if (sanitizedKey && sanitizedValue) {
      sanitized.append(sanitizedKey, sanitizedValue);
    }
  }
  
  return sanitized;
};

// Content Security Policy nonce generator
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Secure headers configuration
export const getSecurityHeaders = (nonce?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
  
  if (nonce) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'unsafe-inline'`,
      "img-src 'self' data: https: cdn.myanimelist.net img1.ak.crunchyroll.com image.tmdb.org s4.anilist.co media.kitsu.io",
      "font-src 'self' data:",
      "connect-src 'self' https://axtpbgsjbmhbuqomarcr.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }
  
  return headers;
};

// Rate limiting utilities
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 3,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now > attempt.resetTime) {
      // Reset or first attempt
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt || Date.now() > attempt.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - attempt.count);
  }
  
  getResetTime(identifier: string): number | null {
    const attempt = this.attempts.get(identifier);
    if (!attempt || Date.now() > attempt.resetTime) {
      return null;
    }
    return attempt.resetTime;
  }
  
  clear(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Create rate limiter instances for different actions
export const authRateLimiter = new RateLimiter(3, 15 * 60 * 1000); // 3 attempts per 15 minutes
export const searchRateLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute
export const apiRateLimiter = new RateLimiter(1000, 60 * 60 * 1000); // 1000 requests per hour

// Security event logging
export const logSecurityEvent = (event: {
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  data?: any;
}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...event,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.warn('[Security Event]', logEntry);
  }
  
  // In production, this could be sent to a security monitoring service
  if (import.meta.env.PROD && event.severity === 'critical') {
    // Queue for security audit log
    try {
      localStorage.setItem(
        `security_event_${Date.now()}`, 
        JSON.stringify(logEntry)
      );
    } catch {
      // Silently fail if localStorage is full
    }
  }
};

export default {
  sanitizeInput,
  sanitizeHtml,
  sanitizeMarkdown,
  validateAndSanitizeUrl,
  validateImageUrl,
  validateFormData,
  sanitizeUrlParams,
  generateCSPNonce,
  getSecurityHeaders,
  RateLimiter,
  authRateLimiter,
  searchRateLimiter,
  apiRateLimiter,
  logSecurityEvent
};