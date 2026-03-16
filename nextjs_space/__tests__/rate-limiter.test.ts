import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { createRateLimiter, getRateLimitStats, getRateLimitIdentifier, rateLimiters } from '../lib/rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // Helper to generate unique identifiers for test isolation
  let testCounter = 0
  const uniqueId = () => `test-user-${++testCounter}`

  describe('createRateLimiter', () => {
    test('should allow requests within limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
      })

      const result = await limiter(uniqueId())

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    test('should block requests exceeding limit', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      })

      const id = uniqueId()
      // First two requests should be allowed
      await limiter(id)
      await limiter(id)

      // Third request should be blocked
      const result = await limiter(id)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    test('should return custom message when limit exceeded', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        message: 'Custom rate limit message',
      })

      const id = uniqueId()
      await limiter(id)
      const result = await limiter(id)

      expect(result.allowed).toBe(false)
      expect(result.message).toBe('Custom rate limit message')
    })

    test('should reset after window expires', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
      })

      const id = uniqueId()
      // Use up the limit
      await limiter(id)

      // Should be blocked
      let result = await limiter(id)
      expect(result.allowed).toBe(false)

      // Advance time past the window
      vi.advanceTimersByTime(65000)

      // Should be allowed again
      result = await limiter(id)
      expect(result.allowed).toBe(true)
    })

    test('should track different identifiers separately', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
      })

      const id1 = uniqueId()
      const id2 = uniqueId()

      // User 1 makes requests
      let result = await limiter(id1)
      expect(result.allowed).toBe(true)

      result = await limiter(id1)
      expect(result.allowed).toBe(true)

      // User 1 blocked
      result = await limiter(id1)
      expect(result.allowed).toBe(false)

      // User 2 should still be allowed
      result = await limiter(id2)
      expect(result.allowed).toBe(true)
    })

    test('should count requests correctly when skipSuccessfulRequests is true', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipSuccessfulRequests: true,
      })

      const id = uniqueId()
      // Success requests shouldn't count
      let result = await limiter(id, { isSuccess: true })
      expect(result.remaining).toBe(2)

      // Failed requests should count
      result = await limiter(id, { isSuccess: false })
      expect(result.remaining).toBe(1)

      result = await limiter(id, { isSuccess: false })
      expect(result.remaining).toBe(0)

      // Should be blocked now
      result = await limiter(id, { isSuccess: false })
      expect(result.allowed).toBe(false)
    })

    test('should count requests correctly when skipFailedRequests is true', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        skipFailedRequests: true,
      })

      const id = uniqueId()
      // Failed requests shouldn't count
      let result = await limiter(id, { isSuccess: false })
      expect(result.remaining).toBe(2)

      // Success requests should count
      result = await limiter(id, { isSuccess: true })
      expect(result.remaining).toBe(1)

      result = await limiter(id, { isSuccess: true })
      expect(result.remaining).toBe(0)

      // Should be blocked now
      result = await limiter(id, { isSuccess: true })
      expect(result.allowed).toBe(false)
    })
  })

  describe('getRateLimitStats', () => {
    test('should return stats about rate limit store', async () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      })

      await limiter('user-1')
      await limiter('user-2')
      await limiter('user-3')

      const stats = getRateLimitStats()

      expect(stats.totalEntries).toBeGreaterThanOrEqual(3)
      expect(stats.activeLimits).toBeGreaterThanOrEqual(3)
    })
  })

  describe('getRateLimitIdentifier', () => {
    test('should use userId when provided', () => {
      const req = new Request('http://example.com')
      const identifier = getRateLimitIdentifier(req, 'user-123')

      expect(identifier).toBe('user:user-123')
    })

    test('should use IP address when no userId', () => {
      const req = new Request('http://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      })
      const identifier = getRateLimitIdentifier(req)

      expect(identifier).toBe('ip:192.168.1.1')
    })

    test('should use x-real-ip when no x-forwarded-for', () => {
      const req = new Request('http://example.com', {
        headers: { 'x-real-ip': '192.168.1.2' },
      })
      const identifier = getRateLimitIdentifier(req)

      expect(identifier).toBe('ip:192.168.1.2')
    })

    test('should return unknown when no headers or userId', () => {
      const req = new Request('http://example.com')
      const identifier = getRateLimitIdentifier(req)

      expect(identifier).toBe('ip:unknown')
    })
  })

  describe('rateLimiters presets', () => {
    test('should have auth rate limiter', () => {
      expect(rateLimiters.auth).toBeDefined()
    })

    test('should have api rate limiter', () => {
      expect(rateLimiters.api).toBeDefined()
    })

    test('should have upload rate limiter', () => {
      expect(rateLimiters.upload).toBeDefined()
    })

    test('should have webhook rate limiter', () => {
      expect(rateLimiters.webhook).toBeDefined()
    })

    test('should have passwordReset rate limiter', () => {
      expect(rateLimiters.passwordReset).toBeDefined()
    })
  })
})