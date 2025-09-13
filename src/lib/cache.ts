interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  defaultTTL: number; // Default TTL in milliseconds
  maxSize: number; // Maximum number of entries
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = { defaultTTL: 5 * 60 * 1000, maxSize: 1000 }) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Create cache instances for different data types
export const openaiCache = new MemoryCache({
  defaultTTL: 30 * 60 * 1000, // 30 minutes for OpenAI responses
  maxSize: 500
});

export const userCache = new MemoryCache({
  defaultTTL: 10 * 60 * 1000, // 10 minutes for user data
  maxSize: 1000
});

export const analyticsCache = new MemoryCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes for analytics data
  maxSize: 100
});

// Cache key generators
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `profile:${userId}`,
  userIntent: (userId: string) => `intent:${userId}`,
  openaiResponse: (hash: string) => `openai:${hash}`,
  analytics: (type: string, params?: string) => `analytics:${type}${params ? `:${params}` : ''}`,
  jobFitScore: (jobId: string, profileHash: string) => `fit:${jobId}:${profileHash}`
};

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  cache: MemoryCache,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyGenerator(...args);
      const cached = cache.get(key);
      
      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      cache.set(key, result, ttl);
      return result;
    };
  };
}

// Utility functions for common caching patterns
export async function getCachedOrFetch<T>(
  cache: MemoryCache,
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
}

// Hash function for creating cache keys from objects
export function hashObject(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}
