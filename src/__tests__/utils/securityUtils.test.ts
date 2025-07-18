import { describe, it, expect, vi, beforeEach } from 'vitest';
import DOMPurify from 'dompurify';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn(),
  },
}));

describe('Security Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Sanitization', () => {
    const sanitizeInput = (input: string): string => {
      return DOMPurify.sanitize(input, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });
    };

    it('should sanitize XSS attempts', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<svg onload="alert(1)">',
        '<div onclick="alert(1)">Click me</div>',
      ];

      // Mock DOMPurify to return sanitized content
      (DOMPurify.sanitize as any).mockImplementation((input: string) => {
        return input.replace(/<[^>]*>/g, '').replace(/javascript:/g, '');
      });

      maliciousInputs.forEach(input => {
        const result = sanitizeInput(input);
        expect(DOMPurify.sanitize).toHaveBeenCalledWith(input, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: []
        });
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('javascript:');
      });
    });

    it('should preserve safe content', () => {
      const safeInputs = [
        'Hello World',
        'This is a normal comment',
        'Email: test@example.com',
        'Numbers: 123.45',
      ];

      (DOMPurify.sanitize as any).mockImplementation((input: string) => input);

      safeInputs.forEach(input => {
        const result = sanitizeInput(input);
        expect(result).toBe(input);
      });
    });

    it('should handle empty and null inputs', () => {
      (DOMPurify.sanitize as any).mockImplementation((input: string) => input || '');

      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });
  });

  describe('CSRF Token Generation', () => {
    const generateCSRFToken = (): string => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes * 2 hex chars
      expect(token2).toHaveLength(64);
    });

    it('should generate tokens with only valid hex characters', () => {
      const token = generateCSRFToken();
      const hexRegex = /^[0-9a-f]+$/;
      expect(hexRegex.test(token)).toBe(true);
    });
  });

  describe('Rate Limiting Logic', () => {
    interface RateLimitEntry {
      count: number;
      resetTime: number;
    }

    const rateLimits = new Map<string, RateLimitEntry>();

    const checkRateLimit = (key: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
      const now = Date.now();
      const entry = rateLimits.get(key);

      if (!entry || now > entry.resetTime) {
        rateLimits.set(key, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (entry.count >= maxRequests) {
        return false;
      }

      entry.count++;
      return true;
    };

    beforeEach(() => {
      rateLimits.clear();
    });

    it('should allow requests within limit', () => {
      const key = 'test-user';
      
      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(key, 5, 60000)).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const key = 'test-user';
      
      // Use up the rate limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, 5, 60000);
      }
      
      // Next request should be blocked
      expect(checkRateLimit(key, 5, 60000)).toBe(false);
    });

    it('should reset after time window', () => {
      const key = 'test-user';
      
      // Mock Date.now to control time
      const originalNow = Date.now;
      let mockTime = 1000000000;
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      // Use up the rate limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, 5, 60000);
      }
      
      // Should be blocked
      expect(checkRateLimit(key, 5, 60000)).toBe(false);
      
      // Advance time past window
      mockTime += 61000;
      
      // Should be allowed again
      expect(checkRateLimit(key, 5, 60000)).toBe(true);
      
      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should handle different users independently', () => {
      const user1 = 'user1';
      const user2 = 'user2';
      
      // User1 uses up their limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(user1, 5, 60000);
      }
      
      // User1 should be blocked
      expect(checkRateLimit(user1, 5, 60000)).toBe(false);
      
      // User2 should still be allowed
      expect(checkRateLimit(user2, 5, 60000)).toBe(true);
    });
  });

  describe('URL Parameter Validation', () => {
    const validateUrlParam = (param: string, allowedPattern: RegExp): boolean => {
      if (typeof param !== 'string') return false;
      if (param.length === 0) return false;
      if (param.length > 100) return false; // Prevent excessively long inputs
      return allowedPattern.test(param);
    };

    it('should validate UUID parameters', () => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
      ];
      
      const invalidUuids = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-426614174000-extra',
        '',
        'g23e4567-e89b-12d3-a456-426614174000', // invalid hex char
      ];

      validUuids.forEach(uuid => {
        expect(validateUrlParam(uuid, uuidPattern)).toBe(true);
      });

      invalidUuids.forEach(uuid => {
        expect(validateUrlParam(uuid, uuidPattern)).toBe(false);
      });
    });

    it('should validate alphanumeric parameters', () => {
      const alphanumericPattern = /^[a-zA-Z0-9]+$/;
      
      expect(validateUrlParam('abc123', alphanumericPattern)).toBe(true);
      expect(validateUrlParam('ABC123', alphanumericPattern)).toBe(true);
      expect(validateUrlParam('123', alphanumericPattern)).toBe(true);
      
      expect(validateUrlParam('abc-123', alphanumericPattern)).toBe(false);
      expect(validateUrlParam('abc 123', alphanumericPattern)).toBe(false);
      expect(validateUrlParam('abc@123', alphanumericPattern)).toBe(false);
      expect(validateUrlParam('<script>', alphanumericPattern)).toBe(false);
    });

    it('should reject overly long parameters', () => {
      const pattern = /^[a-zA-Z0-9]+$/;
      const longString = 'a'.repeat(101);
      
      expect(validateUrlParam(longString, pattern)).toBe(false);
    });

    it('should handle non-string inputs', () => {
      const pattern = /^[a-zA-Z0-9]+$/;
      
      expect(validateUrlParam(123 as any, pattern)).toBe(false);
      expect(validateUrlParam(null as any, pattern)).toBe(false);
      expect(validateUrlParam(undefined as any, pattern)).toBe(false);
      expect(validateUrlParam({} as any, pattern)).toBe(false);
    });
  });
});