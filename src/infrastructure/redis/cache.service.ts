import { Time } from '@/shared/constants/time';
import { LoggingService } from '../observability/logging/logging.service';
import { getEnvs } from '@/shared/utils/getEnv';
import Redis, { ChainableCommander } from 'ioredis';
import { ICacheService } from '@/application/services/cache.service';

const { REDIS_DB, REDIS_HOST, REDIS_KEY_PREFIX, REDIS_PASSWORD, REDIS_PORT } = getEnvs({
  REDIS_PORT: 6379,
  REDIS_HOST: 'localhost',
  REDIS_DB: 1,
  REDIS_KEY_PREFIX: 'edulearn:auth:',
  REDIS_PASSWORD: '',
});

/**
 * RedisCacheService
 * Provides singleton-based interaction with Redis and implements caching best practices.
 * Supports JSON serializable values, metrics, batch operations, and transactional/misc. helpers.
 */
export class RedisCacheService implements ICacheService {
  private static instance: RedisCacheService;
  private client: Redis;
  private logger = LoggingService.getInstance('RedisCacheService');

  // Simple in-memory statistics
  private hits = 0;
  private misses = 0;
  private errors = 0;

  private constructor() {
    try {
      this.client = new Redis(Number(REDIS_PORT), REDIS_HOST.toString(), {
        ...(REDIS_PASSWORD && { password: REDIS_PASSWORD.toString() }),
        db: Number(REDIS_DB),
        keyPrefix: REDIS_KEY_PREFIX.toString(),
        enableOfflineQueue: false,
        retryStrategy: (retries) => {
          if (retries > 5) return null;
          return Math.max(retries * 100, 3000);
        },
      });

      this.client.on('error', (err) => {
        this.errors++;
        this.logger.error('Redis error', { err });
      });
      this.client.on('connect', () =>
        this.logger.info(`Redis connected to ${REDIS_HOST}:${REDIS_PORT}`),
      );
      this.client.on('ready', () => this.logger.info('Redis is ready'));
    } catch (error) {
      this.logger.error('Error while instantiating redis', { error });
      throw error;
    }
  }

  /**
   * Returns the singleton instance.
   */
  public static getInstance(): RedisCacheService {
    if (!RedisCacheService.instance) {
      RedisCacheService.instance = new RedisCacheService();
    }
    return RedisCacheService.instance;
  }

  /**
   * Retrieve the raw Redis client (ioredis).
   */
  public getClient(): Redis {
    return this.client;
  }

  /**
   * Connect manually to Redis (for clients supporting explicit connect/disconnect)
   */
  public async connect(): Promise<void> {
    try {
      // Only connect if in "disconnected" mode
      if (typeof this.client.status === 'string' && this.client.status !== 'ready') {
        await this.client.connect();
        this.logger.info('Manual Redis connect invoked');
      }
    } catch (error) {
      this.logger.error('Failed to connect to Redis', { error });
      throw error;
    }
  }

  /**
   * Disconnect from Redis (gracefully)
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.client && this.client.status !== 'end') {
        await this.client.quit();
        this.logger.info('Redis client disconnected gracefully');
      }
    } catch (error) {
      this.logger.error('Error disconnecting from Redis', { error });
      throw error;
    }
  }

  /**
   * Ping Redis server and return duration in ms.
   */
  public async ping(): Promise<number> {
    const start = Date.now();
    await this.client.ping();
    return Date.now() - start;
  }

  /**
   * Get value from cache. Returns null if key doesn't exist or on parse error.
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value) {
        this.hits++;
        try {
          return JSON.parse(value) as T;
        } catch (parseError) {
          this.logger.error(`Cache get parse error for key ${key}`, { error: parseError, value });
          return null;
        }
      } else {
        this.misses++;
        return null;
      }
    } catch (error) {
      this.errors++;
      this.logger.error(`Cache get failed for key ${key}`, { error });
      throw error;
    }
  }

  /**
   * Set value in cache. If ttl (in seconds) is provided, sets expiry.
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      this.errors++;
      this.logger.error(`Cache set failed for key ${key}`, { error });
      throw error;
    }
  }

  /**
   * Deletes a key.
   */
  public async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.errors++;
      this.logger.error(`Cache delete failed for key ${key}`, { error });
      throw error;
    }
  }

  /**
   * Checks if a key exists (returns true if exists).
   */
  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return !!result;
    } catch (error) {
      this.errors++;
      this.logger.error(`Cache exists check failed for key ${key}`, { error });
      throw error;
    }
  }

  /**
   * Returns all keys matching a pattern (use with caution).
   */
  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.errors++;
      this.logger.error(`Cache keys failed for pattern ${pattern}`, { error });
      throw error;
    }
  }

  /**
   * Completely remove all keys from DB.
   */
  public async flush(): Promise<void> {
    try {
      await this.client.flushdb();
      this.logger.info('Redis database flushed');
    } catch (error) {
      this.errors++;
      this.logger.error(`Cache flush failed`, { error });
      throw error;
    }
  }

  /**
   * Batch: Get multiple keys at once.
   */
  public async getMultiple<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];
      const values = await this.client.mget(keys);
      return values.map((val) => {
        if (!val) return null;
        try {
          return JSON.parse(val) as T;
        } catch (parseError) {
          this.logger.error('Cache getMultiple: parse error', { error: parseError, val });
          return null;
        }
      });
    } catch (error) {
      this.errors++;
      this.logger.error('Cache getMultiple failed', { error });
      throw error;
    }
  }

  /**
   * Batch: Set multiple items, optionally with TTL applied to all.
   */
  public async setMultiple<T>(entries: { key: string; value: T }[], ttl?: number): Promise<void> {
    if (!Array.isArray(entries) || entries.length === 0) return;
    try {
      const pipeline: ChainableCommander = this.client.pipeline();
      for (const { key, value } of entries) {
        // Prevent undefined keys or values in pipeline
        if (typeof key !== 'string' || typeof value === 'undefined') {
          this.logger.warn('Skipping entry with invalid key or value in setMultiple', {
            key,
            value,
          });
          continue;
        }
        let stringValue: string;
        try {
          stringValue = JSON.stringify(value);
        } catch (jsonErr) {
          this.logger.error('Failed to stringify cache value in setMultiple', {
            key,
            value,
            error: jsonErr,
          });
          continue; // skip this entry
        }
        if (typeof ttl === 'number' && ttl > 0) {
          pipeline.setex(key, ttl, stringValue);
        } else {
          pipeline.set(key, stringValue);
        }
      }
      const results = await pipeline.exec();
      // Check for errors in results
      if (Array.isArray(results)) {
        for (const [idx, [err]] of results.entries()) {
          if (err) {
            this.errors++;
            this.logger.error(`Pipeline error at command #${idx} in setMultiple`, { error: err });
          }
        }
      }
    } catch (error) {
      this.errors++;
      this.logger.error('Cache setMultiple failed', { error });
      throw error;
    }
  }

  /**
   * Atomically increments a key (optionally creates with initial value/expiry).
   */
  public async incrBy(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      this.errors++;
      this.logger.error('Cache incrBy failed', { error, key, amount });
      throw error;
    }
  }

  /**
   * Atomically decrements a key.
   */
  public async decrBy(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.client.decrby(key, amount);
    } catch (error) {
      this.errors++;
      this.logger.error('Cache decrBy failed', { error, key, amount });
      throw error;
    }
  }

  /**
   * Fetches TTL for a key (in seconds). Returns -1 if no expiry, -2 if key doesn't exist.
   */
  public async getTTL(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.errors++;
      this.logger.error('Cache getTTL failed', { error, key });
      throw error;
    }
  }

  /**
   * Sets the expiry/TTL for a key, in seconds.
   */
  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const res = await this.client.expire(key, seconds);
      return !!res;
    } catch (error) {
      this.errors++;
      this.logger.error('Cache expire failed', { error, key, seconds });
      throw error;
    }
  }

  /**
   * Clear all keys matching a pattern with a pipeline (efficient batch deletion).
   */
  public async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      const pipeline = this.client.pipeline();
      for (const key of keys) {
        pipeline.del(key);
      }
      await pipeline.exec();
      this.logger.info(`Cleared ${keys.length} keys matching pattern "${pattern}"`);
      return keys.length;
    } catch (error) {
      this.errors++;
      this.logger.error(`Cache deleteByPattern failed for pattern ${pattern}`, { error });
      throw error;
    }
  }

  /**
   * Publishes a message to a Redis Pub/Sub channel
   */
  public async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.client.publish(channel, message);
    } catch (error) {
      this.errors++;
      this.logger.error('Cache publish failed', { error, channel, message });
      throw error;
    }
  }

  /**
   * Subscribes to messages on a channel. Returns unsubscribe function.
   */
  public async subscribe(
    channel: string,
    onMessage: (channel: string, message: string) => void,
  ): Promise<() => Promise<void>> {
    // Use a duplicated client for subscriptions
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, (err, count) => {
      if (err) {
        this.logger.error('Cache subscribe error', { error: err, channel, count });
      } else {
        this.logger.info(`Cache subscribed to channel: ${channel}`);
      }
    });
    subscriber.on('message', onMessage);

    // Return unsubscribe capability
    return async () => {
      await subscriber.unsubscribe(channel);
      await subscriber.quit();
      this.logger.info(`Cache unsubscribed from channel: ${channel}`);
    };
  }

  /**
   * Provides basic metrics about operations and Redis state.
   */
  public async getMetrics() {
    let memoryInfoStr = '';
    let statsInfoStr = '';
    try {
      memoryInfoStr = await this.client.info('memory');
    } catch (err) {
      this.logger.warn('Could not get memory info from redis', { error: err });
    }
    try {
      statsInfoStr = await this.client.info('stats');
    } catch (err) {
      this.logger.warn('Could not get stats info from redis', { error: err });
    }

    const memoryUsage = this.parseMemoryInfo(memoryInfoStr || '');
    const redisStats = this.parseStatsInfo(statsInfoStr || '');

    return {
      hitRatio: this.hits / (this.hits + this.misses || 1),
      totalOperations: this.hits + this.misses,
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      memoryUsage,
      redisStats,
    };
  }

  private parseMemoryInfo(info: string) {
    if (!info) return {};
    const lines = info.split('\r\n');
    return {
      usedMemory: lines.find((l) => l.startsWith('used_memory:'))?.split(':')[1],
      usedMemoryRss: lines.find((l) => l.startsWith('used_memory_rss:'))?.split(':')[1],
      fragmentationRatio: lines
        .find((l) => l.startsWith('mem_fragmentation_ratio:'))
        ?.split(':')[1],
    };
  }

  private parseStatsInfo(info: string) {
    if (!info) return {};
    const lines = info.split('\r\n');
    return {
      keyspaceHits: lines.find((l) => l.startsWith('keyspace_hits:'))?.split(':')[1],
      keyspaceMisses: lines.find((l) => l.startsWith('keyspace_misses:'))?.split(':')[1],
    };
  }

  public logMetrics(): void {
    setInterval(async () => {
      const metrics = await this.getMetrics();
      console.table([
        {
          label: 'Redis metrics',
        },
        {
          hitRatio: metrics.hitRatio,
          memoryUsage: metrics.memoryUsage?.usedMemory,
          fragmentationRatio: metrics.memoryUsage?.fragmentationRatio,
          keyspaceHits: metrics.redisStats?.keyspaceHits,
          keyspaceMisses: metrics.redisStats?.keyspaceMisses,
        },
      ]);
    }, Time.MINUTES * 1); // info every minute
  }
}

// export const redisClient = RedisCacheService.getInstance();
