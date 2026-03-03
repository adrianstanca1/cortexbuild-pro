import Redis from 'ioredis'
import logger from './logger.js'

// Redis client configuration
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
})

redis.on('connect', () => {
  logger.info('✅ Redis connected')
})

redis.on('error', (error) => {
  logger.error('❌ Redis error', { error: error.message })
})

// Cache helper functions
export const cache = {
  // Get cached value
  get: async (key: string): Promise<string | null> => {
    try {
      return await redis.get(key)
    } catch (error) {
      logger.error('Redis get error', { error: error instanceof Error ? error.message : String(error), key })
      return null
    }
  },

  // Set cached value with optional TTL (time to live in seconds)
  set: async (key: string, value: string, ttl?: number): Promise<void> => {
    try {
      if (ttl) {
        await redis.setex(key, ttl, value)
      } else {
        await redis.set(key, value)
      }
    } catch (error) {
      logger.error('Redis set error', { error: error instanceof Error ? error.message : String(error), key })
    }
  },

  // Delete cached value
  del: async (key: string): Promise<void> => {
    try {
      await redis.del(key)
    } catch (error) {
      logger.error('Redis del error', { error: error instanceof Error ? error.message : String(error), key })
    }
  },

  // Check if key exists
  exists: async (key: string): Promise<boolean> => {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Redis exists error', { error: error instanceof Error ? error.message : String(error), key })
      return false
    }
  },

  // Set expiry on key
  expire: async (key: string, seconds: number): Promise<void> => {
    try {
      await redis.expire(key, seconds)
    } catch (error) {
      logger.error('Redis expire error', { error: error instanceof Error ? error.message : String(error), key })
    }
  },
}

export default redis

