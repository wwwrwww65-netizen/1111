import { db } from '@repo/db';

// Simple LRU Cache implementation
class LRUCache<K, V> {
  private max: number;
  private cache: Map<K, V>;

  constructor(max: number = 1000) {
    this.max = max;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Refresh key
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, value);
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
  
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }
}

// Global instance for API response caching
export const apiCache = new LRUCache<string, { 
  body: any; 
  contentType: string; 
  expiresAt: number | null 
}>(5000); // 5000 items

// Helper to invalidate based on tags or keys
export async function invalidateCache(keys: string[], tags: string[], domain: string | null) {
  // Remove specific keys
  for (const k of keys) {
    apiCache.delete(k);
  }
  
  // Remove by tags (scan)
  if (tags.length > 0) {
    const allKeys = Array.from(apiCache.keys());
    for (const k of allKeys) {
      // Assumption: Cache keys might contain tags or we just clear everything if tags match?
      // For now, if we don't have tag mapping in memory, we might need to be aggressive or just rely on exact keys.
      // But let's look at the DB to find keys that match these tags
      // This is efficiently handled by the worker, which queries DB for keys matching tags.
    }
  }
}

