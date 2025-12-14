/**
 * Client-Side Caching Strategy (L004)
 * Provides in-memory caching with TTL support
 */

// ============================================================================
// CACHE TYPES
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.defaultTTL;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
}

// Singleton instance
export const cache = new MemoryCache();

// ============================================================================
// CACHE HELPERS
// ============================================================================

/**
 * Cache key generators for common patterns
 */
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userRewards: (userId: string) => `user:${userId}:rewards`,
  userHabits: (userId: string) => `user:${userId}:habits`,
  userBadges: (userId: string) => `user:${userId}:badges`,
  habit: (habitId: string) => `habit:${habitId}`,
  habitLogs: (userId: string, date: string) => `user:${userId}:logs:${date}`,
  analytics: (userId: string, range: string) => `user:${userId}:analytics:${range}`,
  leaderboard: (type: string) => `leaderboard:${type}`,
  badges: () => 'badges:all',
  themes: () => 'themes:all',
  shopItems: () => 'shop:items',
};

/**
 * TTL presets in milliseconds
 */
export const cacheTTL = {
  short: 30 * 1000,        // 30 seconds
  medium: 5 * 60 * 1000,   // 5 minutes
  long: 30 * 60 * 1000,    // 30 minutes
  hour: 60 * 60 * 1000,    // 1 hour
  day: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Fetch with cache wrapper
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  cache.set(key, data, options);
  
  return data;
}

/**
 * Stale-while-revalidate pattern
 */
export async function fetchSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<{ data: T; isStale: boolean }> {
  const cached = cache.get<T>(key);
  
  if (cached !== null) {
    // Return cached data immediately, revalidate in background
    fetcher()
      .then((freshData) => {
        cache.set(key, freshData, options);
      })
      .catch(() => {
        // Silently fail background revalidation
      });
    
    return { data: cached, isStale: true };
  }

  // No cache, fetch fresh
  const data = await fetcher();
  cache.set(key, data, options);
  
  return { data, isStale: false };
}

/**
 * Invalidate user-related cache
 */
export function invalidateUserCache(userId: string): void {
  cache.invalidatePattern(`user:${userId}`);
}

/**
 * Invalidate all cache
 */
export function invalidateAllCache(): void {
  cache.clear();
}

// ============================================================================
// REACT HOOK FOR CACHING
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface UseCacheOptions<T> extends CacheOptions {
  initialData?: T;
  enabled?: boolean;
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions<T> = {}
) {
  const { initialData, enabled = true, ...cacheOptions } = options;
  
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchWithCache(key, fetcher, cacheOptions);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fetch failed'));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, enabled, cacheOptions]);

  const invalidate = useCallback(() => {
    cache.delete(key);
    refetch();
  }, [key, refetch]);

  useEffect(() => {
    // Check cache first
    const cached = cache.get<T>(key);
    if (cached !== null) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    refetch();
  }, [key, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
  };
}

export default cache;
