/**
 * Rate Limiter Tests
 */

import { createRateLimiter, rateLimiters, getRateLimitIdentifier } from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
  describe('createRateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });
      
      const identifier = 'test-user';
      
      for (let i = 0; i < 5; i++) {
        const result = await limiter(identifier);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });
    
    it('should block requests when limit exceeded', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 3,
      });
      
      const identifier = 'test-user-2';
      
      // Use up all requests
      for (let i = 0; i < 3; i++) {
        await limiter(identifier);
      }
      
      // Next request should be blocked
      const result = await limiter(identifier);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
    
    it('should reset after window expires', async () => {
      const limiter = createRateLimiter({
        windowMs: 100, // 100ms window
        maxRequests: 2,
      });
      
      const identifier = 'test-user-3';
      
      // Use up requests
      await limiter(identifier);
      await limiter(identifier);
      
      // Should be blocked
      let result = await limiter(identifier);
      expect(result.allowed).toBe(false);
      
      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be allowed again
      result = await limiter(identifier);
      expect(result.allowed).toBe(true);
    });
    
    it('should handle different identifiers independently', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      });
      
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      // Use up requests for user1
      await limiter(user1);
      await limiter(user1);
      
      // user1 should be blocked
      let result = await limiter(user1);
      expect(result.allowed).toBe(false);
      
      // user2 should still be allowed
      result = await limiter(user2);
      expect(result.allowed).toBe(true);
    });
  });
  
  describe('getRateLimitIdentifier', () => {
    it('should use userId when provided', () => {
      const request = {
        headers: new Headers(),
      } as Request;
      const identifier = getRateLimitIdentifier(request, 'user-123');
      
      expect(identifier).toBe('user:user-123');
    });
    
    it('should use IP address when userId not provided', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1');
      const request = {
        headers,
      } as Request;
      const identifier = getRateLimitIdentifier(request);
      
      expect(identifier).toBe('ip:192.168.1.1');
    });
    
    it('should handle missing IP headers', () => {
      const request = {
        headers: new Headers(),
      } as Request;
      const identifier = getRateLimitIdentifier(request);
      
      expect(identifier).toBe('ip:unknown');
    });
  });
  
  describe('predefined rate limiters', () => {
    it('should have auth rate limiter configured', () => {
      expect(rateLimiters.auth).toBeDefined();
    });
    
    it('should have api rate limiter configured', () => {
      expect(rateLimiters.api).toBeDefined();
    });
    
    it('should have upload rate limiter configured', () => {
      expect(rateLimiters.upload).toBeDefined();
    });
    
    it('should have webhook rate limiter configured', () => {
      expect(rateLimiters.webhook).toBeDefined();
    });
  });
});
