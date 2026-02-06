import Redis from "ioredis";

/**
 * Interface representing a cache service for storing and retrieving data.
 */
export interface ICacheService {
  /**
   * Retrieves a value from the cache by its key.
   *
   * @template T - The type of the value to retrieve.
   * @param key - The key associated with the cached value.
   * @returns A promise that resolves to the cached value of type `T`, or `null` if the key does not exist.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Stores a value in the cache with an optional time-to-live (TTL).
   *
   * @template T - The type of the value to store.
   * @param key - The key to associate with the value.
   * @param value - The value to store in the cache.
   * @param ttl - Optional. Time-to-live in seconds.
   * @returns A promise that resolves when the value has been stored.
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Deletes a value from the cache by its key.
   *
   * @param key - The key associated with the value to delete.
   * @returns A promise that resolves when the value has been removed.
   */
  delete(key: string): Promise<void>;

  /**
   * Retrieves multiple values from the cache by their keys.
   *
   * @template T - The type of the values to retrieve.
   * @param keys - An array of keys to retrieve.
   * @returns A promise that resolves to an array of cached values of type `T` or `null` if the key does not exist.
   */
  getMultiple<T>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Stores multiple key-value pairs in the cache, with optional TTL applied to all entries.
   *
   * @template T - The type of the values to store.
   * @param entries - An array of objects with key and value properties.
   * @param ttl - Optional. Time-to-live in seconds for all entries.
   * @returns A promise that resolves when all values have been stored.
   */
  setMultiple<T>(entries: { key: string; value: T }[], ttl?: number): Promise<void>;

  /**
   * Returns all keys matching the given pattern.
   *
   * @param pattern - The pattern to match keys (glob-style syntax).
   * @returns A promise that resolves to an array of key strings.
   */
  keys(pattern: string): Promise<string[]>;

  /**
   * Completely removes all keys from the cache/database.
   *
   * @returns A promise that resolves when the cache has been flushed.
   */
  flush(): Promise<void>;

  /**
   * Atomically increments the value of a key by a given number.
   *
   * @param key - The key of the value to increment.
   * @param amount - The increment amount. Defaults to 1.
   * @returns A promise that resolves to the new value.
   */
  incrBy(key: string, amount?: number): Promise<number>;

  /**
   * Atomically decrements the value of a key by a given number.
   *
   * @param key - The key of the value to decrement.
   * @param amount - The decrement amount. Defaults to 1.
   * @returns A promise that resolves to the new value.
   */
  decrBy(key: string, amount?: number): Promise<number>;

  /**
   * Retrieves the TTL (in seconds) for a given key.
   *
   * @param key - The key for which to get the time-to-live.
   * @returns A promise that resolves to the TTL in seconds, -1 if no expiry, -2 if key does not exist.
   */
  getTTL(key: string): Promise<number>;

  getClient(): Redis;
}
