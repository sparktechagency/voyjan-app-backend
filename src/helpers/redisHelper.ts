import { redisClient } from "../config/redis.client";

const redisSet = async (key: string, value: any, query?: Record<string, any>,ttl: number = 60) => {
  const queryString = new URLSearchParams(query as Record<string, string>).toString();
  await redisClient.set(`${key}:${queryString}`, JSON.stringify(value), "EX", ttl);
  return false;
};

const redisGet = async (key: string, query?: Record<string, any>) => {
  const queryString = new URLSearchParams(query as Record<string, string>).toString();
  const data = JSON.parse(await redisClient.get(`${key}:${queryString}`) || "[]");

  if (Array.isArray(data) && !data.length) {
    return null;
  }

  return data;
};

const redisHset = async (key: string, query: Record<string, any>, value: any) => {
  const field = new URLSearchParams(query as Record<string, string>).toString();
  await redisClient.hset(key, field, JSON.stringify(value), "EX", 3600);
};

const redisHget = async (key: string, query: Record<string, any>) => {
  const field = new URLSearchParams(query as Record<string, string>).toString();
  const data = JSON.parse(await redisClient.hget(key, field) || "[]");
  if (Array.isArray(data) && !data.length) {
    return null;
  }
  return data;
};

const keyDelete = async (pattern: string) => {
  const keys = await redisClient.keys(pattern);
  console.log('Keys to delete:', keys);
  
  if (!keys.length) return;

  // Use pipeline for efficient deletion
  const pipeline = redisClient.multi();
  keys.forEach((key) => pipeline.del(key));
  await pipeline.exec();
};

// ✅ Fixed HKeyDelete function
const HKeyDelete = async (key: string) => {
  const fields = await redisClient.hkeys(key);
  console.log('Fields to delete:', fields);
  
  if (!fields.length) return;

  await redisClient.hdel(key, ...fields);
};

export const RedisHelper = {
  redisSet,
  redisGet,
  redisHset,
  redisHget,
  keyDelete,
  HKeyDelete,
};
