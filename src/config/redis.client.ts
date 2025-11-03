import Redis from 'ioredis'
import config from '../config'
export const redisClient = new Redis({ host: 'localhost', port: 6379 });
