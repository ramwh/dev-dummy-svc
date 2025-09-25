import { createClient, RedisClientType } from 'redis';
import { config } from '@/config';
import { loggers, logRedisOperation } from '@/utils/logger';
import { CacheError } from '@/utils/errors';

export class CacheManager {
  private static client: RedisClientType;
  private static isConnected: boolean = false;

  static async initialize(): Promise<void> {
    try {
      const redisConfig = {
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        database: config.redis.db,
        ...(config.redis.password && { password: config.redis.password }),
      };

      this.client = createClient(redisConfig);

      // Handle Redis events
      this.client.on('connect', () => {
        loggers.redis.info('Connecting to Redis server...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        loggers.redis.info(
          {
            host: config.redis.host,
            port: config.redis.port,
            db: config.redis.db,
          },
          'Redis connection established'
        );
      });

      this.client.on('error', error => {
        this.isConnected = false;
        loggers.redis.error({ error }, 'Redis connection error');
      });

      this.client.on('end', () => {
        this.isConnected = false;
        loggers.redis.info('Redis connection closed');
      });

      await this.client.connect();

      // Test the connection
      await this.ping();
    } catch (error) {
      loggers.redis.error({ error }, 'Failed to initialize Redis connection');
      throw new CacheError('Redis initialization failed', {
        context: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  static async ping(): Promise<string> {
    const startTime = Date.now();
    try {
      const result = await this.client.ping();
      const duration = Date.now() - startTime;
      logRedisOperation('PING', undefined, duration);
      return result;
    } catch (error) {
      throw new CacheError('Redis ping failed', {
        context: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  static async get<T = string>(key: string): Promise<T | null> {
    this.ensureConnection();
    const startTime = Date.now();

    try {
      const value = await this.client.get(key);
      const duration = Date.now() - startTime;
      logRedisOperation('GET', key, duration);

      if (!value) return null;

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      loggers.redis.error({ key, error }, 'Redis GET operation failed');
      throw new CacheError(`Failed to get key: ${key}`, {
        context: { key, error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  static async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    this.ensureConnection();
    const startTime = Date.now();

    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      const duration = Date.now() - startTime;
      logRedisOperation('SET', key, duration);
    } catch (error) {
      loggers.redis.error({ key, ttlSeconds, error }, 'Redis SET operation failed');
      throw new CacheError(`Failed to set key: ${key}`, {
        context: {
          key,
          ttlSeconds,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  static async del(key: string): Promise<number> {
    this.ensureConnection();
    const startTime = Date.now();

    try {
      const result = await this.client.del(key);
      const duration = Date.now() - startTime;
      logRedisOperation('DEL', key, duration);
      return result;
    } catch (error) {
      loggers.redis.error({ key, error }, 'Redis DEL operation failed');
      throw new CacheError(`Failed to delete key: ${key}`, {
        context: { key, error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  static async exists(key: string): Promise<boolean> {
    this.ensureConnection();
    const startTime = Date.now();

    try {
      const result = await this.client.exists(key);
      const duration = Date.now() - startTime;
      logRedisOperation('EXISTS', key, duration);
      return result === 1;
    } catch (error) {
      loggers.redis.error({ key, error }, 'Redis EXISTS operation failed');
      throw new CacheError(`Failed to check existence of key: ${key}`, {
        context: { key, error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  static async ttl(key: string): Promise<number> {
    this.ensureConnection();
    const startTime = Date.now();

    try {
      const result = await this.client.ttl(key);
      const duration = Date.now() - startTime;
      logRedisOperation('TTL', key, duration);
      return result;
    } catch (error) {
      loggers.redis.error({ key, error }, 'Redis TTL operation failed');
      throw new CacheError(`Failed to get TTL for key: ${key}`, {
        context: { key, error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  static async flush(): Promise<void> {
    this.ensureConnection();
    const startTime = Date.now();

    try {
      await this.client.flushDb();
      const duration = Date.now() - startTime;
      logRedisOperation('FLUSH', undefined, duration);
    } catch (error) {
      loggers.redis.error({ error }, 'Redis FLUSH operation failed');
      throw new CacheError('Failed to flush Redis database', {
        context: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  private static ensureConnection(): void {
    if (!this.isConnected || !this.client) {
      throw new CacheError('Redis connection not established');
    }
  }

  static async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        loggers.redis.info('Redis connection closed');
      }
    } catch (error) {
      loggers.redis.error({ error }, 'Error closing Redis connection');
    }
  }

  static getClient(): RedisClientType {
    this.ensureConnection();
    return this.client;
  }
}

export default CacheManager;
