import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.warn('Redis Client Disconnected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
};

// Cache utility functions
export const cacheSet = async (key: string, value: any, expireInSeconds?: number): Promise<void> => {
  try {
    const client = getRedisClient();
    const serializedValue = JSON.stringify(value);
    
    if (expireInSeconds) {
      await client.setEx(key, expireInSeconds, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
  } catch (error) {
    logger.error('Cache set error:', error);
  }
};

export const cacheGet = async (key: string): Promise<any> => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
};

export const cacheExists = async (key: string): Promise<boolean> => {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Cache exists error:', error);
    return false;
  }
};