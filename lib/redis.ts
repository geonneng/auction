// Redis connection utility for auction data persistence
import { Redis } from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    // Support both Vercel KV and custom Redis
    if (process.env.KV_URL || process.env.REDIS_URL) {
      const redisUrl = process.env.KV_URL || process.env.REDIS_URL
      redis = new Redis(redisUrl!, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        // For serverless environments
        lazyConnect: true,
        maxLoadingTimeout: 3000,
      })
    } else {
      // Fallback to localhost for development
      redis = new Redis({
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
      })
    }

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err)
    })

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully')
    })
  }

  return redis
}

// Redis key helpers
export const RedisKeys = {
  room: (roomId: string) => `auction:room:${roomId}`,
  guest: (roomId: string, nickname: string) => `auction:room:${roomId}:guest:${nickname}`,
  guests: (roomId: string) => `auction:room:${roomId}:guests`,
  bids: (roomId: string) => `auction:room:${roomId}:bids`,
  auctionItems: (roomId: string) => `auction:room:${roomId}:items`,
  roomList: () => 'auction:rooms',
} as const

export type RedisKeyType = keyof typeof RedisKeys
