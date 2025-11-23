/**
 * Query Cache Manager - Microsoft Enterprise Pattern
 * Implements intelligent caching for frequently accessed database queries
 * 
 * Features:
 * - TTL-based cache expiration
 * - Type-safe cache keys
 * - Automatic cache invalidation
 * - Memory-efficient storage
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if valid, otherwise return undefined
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Execute query with caching
   */
  async withCache<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      if (import.meta.env.DEV) {
        console.debug(`[QueryCache] Cache hit: ${key}`);
      }
      return cached;
    }

    // Execute query
    if (import.meta.env.DEV) {
      console.debug(`[QueryCache] Cache miss: ${key}`);
    }
    const data = await queryFn();

    // Store in cache
    this.set(key, data, ttl);

    return data;
  }
}

// Singleton instance
export const queryCache = new QueryCache();

// Cache key builders for type safety
export const CacheKeys = {
  room: (roomId: string) => `room:${roomId}`,
  roomMessages: (roomId: string) => `room:${roomId}:messages`,
  roomAlerts: (roomId: string) => `room:${roomId}:alerts`,
  roomPolls: (roomId: string) => `room:${roomId}:polls`,
  roomFiles: (roomId: string) => `room:${roomId}:files`,
  userRooms: (userId: string) => `user:${userId}:rooms`,
  userThemes: (userId: string) => `user:${userId}:themes`,
  userIntegrations: (userId: string) => `user:${userId}:integrations`,
  pollVotes: (pollId: string) => `poll:${pollId}:votes`,
} as const;

// Cache invalidation helpers
export const invalidateRoomCache = (roomId: string): void => {
  queryCache.invalidatePattern(`room:${roomId}`);
};

export const invalidateUserCache = (userId: string): void => {
  queryCache.invalidatePattern(`user:${userId}`);
};

export default queryCache;
