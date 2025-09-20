import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔴 Redis Connected');
    });

    redisClient.on('ready', () => {
      console.log('🔴 Redis Ready');
    });

    redisClient.on('end', () => {
      console.log('🔴 Redis Connection Ended');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('Error connecting to Redis:', error);
    // Don't exit process if Redis fails, just log the error
    console.log('⚠️  Continuing without Redis cache...');
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export const setCache = async (key: string, value: string, expireInSeconds?: number): Promise<void> => {
  try {
    if (redisClient && redisClient.isReady) {
      if (expireInSeconds) {
        await redisClient.setEx(key, expireInSeconds, value);
      } else {
        await redisClient.set(key, value);
      }
    }
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

export const getCache = async (key: string): Promise<string | null> => {
  try {
    if (redisClient && redisClient.isReady) {
      return await redisClient.get(key);
    }
    return null;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.del(key);
    }
  } catch (error) {
    console.error('Error deleting cache:', error);
  }
};

export const clearCache = async (pattern?: string): Promise<void> => {
  try {
    if (redisClient && redisClient.isReady) {
      if (pattern) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } else {
        await redisClient.flushAll();
      }
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};