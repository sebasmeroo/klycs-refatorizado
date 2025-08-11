import { info, warn, error } from '@/utils/logger';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
  tags?: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Tags for cache invalidation
  serialize?: boolean; // Whether to serialize data
  compress?: boolean; // Whether to compress data
}

export interface CacheStats {
  totalEntries: number;
  memoryUsage: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry: number;
  newestEntry: number;
}

class CacheService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private hitCount = 0;
  private missCount = 0;
  private readonly MAX_MEMORY_ENTRIES = 1000;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startCleanupTimer();
    this.setupStorageListeners();
  }

  /**
   * Get data from cache
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValid(memoryEntry)) {
        memoryEntry.hits++;
        memoryEntry.lastAccessed = Date.now();
        this.hitCount++;
        
        info('Cache hit (memory)', { 
          component: 'CacheService', 
          key, 
          hits: memoryEntry.hits 
        });
        
        return memoryEntry.data as T;
      }

      // Check localStorage cache
      const localEntry = this.getFromLocalStorage<T>(key);
      if (localEntry) {
        // Promote to memory cache
        this.setInMemory(key, localEntry.data, localEntry.ttl - (Date.now() - localEntry.timestamp), {
          tags: localEntry.tags
        });
        
        this.hitCount++;
        info('Cache hit (localStorage)', { component: 'CacheService', key });
        return localEntry.data;
      }

      // Cache miss
      this.missCount++;
      return null;

    } catch (err) {
      error('Cache get failed', err as Error, { component: 'CacheService', key });
      return null;
    }
  }

  /**
   * Set data in cache
   */
  public async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.DEFAULT_TTL;
      
      // Set in memory cache
      this.setInMemory(key, data, ttl, options);
      
      // Set in localStorage for persistence
      this.setInLocalStorage(key, data, ttl, options);
      
      info('Data cached successfully', { 
        component: 'CacheService', 
        key, 
        ttl,
        tags: options.tags 
      });

    } catch (err) {
      error('Cache set failed', err as Error, { component: 'CacheService', key });
    }
  }

  /**
   * Delete specific key from cache
   */
  public async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      this.deleteFromLocalStorage(key);
      
      info('Cache entry deleted', { component: 'CacheService', key });
    } catch (err) {
      error('Cache delete failed', err as Error, { component: 'CacheService', key });
    }
  }

  /**
   * Clear all cache entries
   */
  public async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      this.clearLocalStorage();
      this.hitCount = 0;
      this.missCount = 0;
      
      info('Cache cleared completely', { component: 'CacheService' });
    } catch (err) {
      error('Cache clear failed', err as Error, { component: 'CacheService' });
    }
  }

  /**
   * Invalidate cache entries by tags
   */
  public async invalidateByTags(tags: string[]): Promise<number> {
    let invalidatedCount = 0;
    
    try {
      // Invalidate memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
          this.memoryCache.delete(key);
          invalidatedCount++;
        }
      }

      // Invalidate localStorage cache
      const localStorageKeys = this.getLocalStorageKeys();
      for (const key of localStorageKeys) {
        const entry = this.getFromLocalStorage(key);
        if (entry?.tags && entry.tags.some(tag => tags.includes(tag))) {
          this.deleteFromLocalStorage(key);
          invalidatedCount++;
        }
      }
      
      info('Cache invalidated by tags', { 
        component: 'CacheService', 
        tags, 
        invalidatedCount 
      });
      
      return invalidatedCount;

    } catch (err) {
      error('Cache invalidation by tags failed', err as Error, { 
        component: 'CacheService', 
        tags 
      });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const entries = Array.from(this.memoryCache.values());
    const totalHits = this.hitCount;
    const totalMisses = this.missCount;
    const totalRequests = totalHits + totalMisses;
    
    return {
      totalEntries: this.memoryCache.size,
      memoryUsage: this.estimateMemoryUsage(),
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalHits,
      totalMisses,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0
    };
  }

  /**
   * Get or set pattern - common caching pattern
   */
  public async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fetcher();
      await this.set(key, data, options);
      
      info('Data fetched and cached', { component: 'CacheService', key });
      return data;
    } catch (err) {
      error('Fetcher function failed', err as Error, { component: 'CacheService', key });
      throw err;
    }
  }

  /**
   * Batch operations
   */
  public async mget<T>(keys: string[]): Promise<Array<T | null>> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  public async mset<T>(entries: Array<{ key: string; data: T; options?: CacheOptions }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, data, options }) => this.set(key, data, options))
    );
  }

  // Private methods

  private setInMemory<T>(key: string, data: T, ttl: number, options: CacheOptions = {}): void {
    // Remove oldest entries if at capacity
    if (this.memoryCache.size >= this.MAX_MEMORY_ENTRIES) {
      this.evictOldestEntries(Math.floor(this.MAX_MEMORY_ENTRIES * 0.1)); // Remove 10%
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now(),
      tags: options.tags
    };

    this.memoryCache.set(key, entry);
  }

  private setInLocalStorage<T>(key: string, data: T, ttl: number, options: CacheOptions = {}): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        hits: 0,
        lastAccessed: Date.now(),
        tags: options.tags
      };

      const cacheKey = this.getCacheKey(key);
      const serializedData = JSON.stringify(entry);
      
      // Check localStorage space
      if (this.getLocalStorageSize() + serializedData.length > 4.5 * 1024 * 1024) { // 4.5MB limit
        this.cleanupLocalStorage();
      }

      localStorage.setItem(cacheKey, serializedData);
    } catch (err) {
      warn('Failed to set localStorage cache', { 
        component: 'CacheService', 
        key, 
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  private getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      if (!this.isValid(entry)) {
        this.deleteFromLocalStorage(key);
        return null;
      }

      return entry;
    } catch (err) {
      warn('Failed to get localStorage cache', { 
        component: 'CacheService', 
        key,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      return null;
    }
  }

  private deleteFromLocalStorage(key: string): void {
    try {
      const cacheKey = this.getCacheKey(key);
      localStorage.removeItem(cacheKey);
    } catch (err) {
      warn('Failed to delete localStorage cache', { 
        component: 'CacheService', 
        key 
      });
    }
  }

  private clearLocalStorage(): void {
    try {
      const keys = this.getLocalStorageKeys();
      keys.forEach(key => {
        const cacheKey = this.getCacheKey(key);
        localStorage.removeItem(cacheKey);
      });
    } catch (err) {
      warn('Failed to clear localStorage cache', { component: 'CacheService' });
    }
  }

  private getLocalStorageKeys(): string[] {
    const keys: string[] = [];
    const prefix = this.getCacheKey('');
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key.replace(prefix, ''));
      }
    }
    
    return keys;
  }

  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    for (let i = 0; i < count && i < entries.length; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
    
    info(`Evicted ${count} oldest cache entries`, { component: 'CacheService' });
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    // Clean localStorage cache
    this.cleanupLocalStorage();

    if (cleanedCount > 0) {
      info(`Cleaned up ${cleanedCount} expired cache entries`, { 
        component: 'CacheService' 
      });
    }
  }

  private cleanupLocalStorage(): void {
    const keys = this.getLocalStorageKeys();
    let cleanedCount = 0;

    keys.forEach(key => {
      const entry = this.getFromLocalStorage(key);
      if (!entry || !this.isValid(entry)) {
        this.deleteFromLocalStorage(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      info(`Cleaned up ${cleanedCount} expired localStorage entries`, { 
        component: 'CacheService' 
      });
    }
  }

  private getCacheKey(key: string): string {
    return `klycs_cache_${key}`;
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    for (const entry of this.memoryCache.values()) {
      size += JSON.stringify(entry).length * 2; // Rough estimate (UTF-16)
    }
    return size;
  }

  private getLocalStorageSize(): number {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('klycs_cache_')) {
        size += key.length + (localStorage.getItem(key)?.length || 0);
      }
    }
    return size * 2; // UTF-16
  }

  private setupStorageListeners(): void {
    // Listen for storage events (other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('klycs_cache_')) {
        const cacheKey = event.key.replace('klycs_cache_', '');
        
        if (event.newValue === null) {
          // Key was deleted in another tab
          this.memoryCache.delete(cacheKey);
        }
      }
    });

    // Clear cache on page unload
    window.addEventListener('beforeunload', () => {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }
    });
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Convenience functions
export const cache = {
  get: <T>(key: string) => cacheService.get<T>(key),
  set: <T>(key: string, data: T, options?: CacheOptions) => cacheService.set(key, data, options),
  delete: (key: string) => cacheService.delete(key),
  clear: () => cacheService.clear(),
  invalidateByTags: (tags: string[]) => cacheService.invalidateByTags(tags),
  getOrSet: <T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions) => 
    cacheService.getOrSet(key, fetcher, options),
  getStats: () => cacheService.getStats()
};

export default cacheService;