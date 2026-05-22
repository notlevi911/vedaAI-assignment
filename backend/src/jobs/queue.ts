import { Queue } from 'bullmq';
import Redis from 'ioredis';

let redisAvailable = false;

export const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 2000,
  retryStrategy: () => null, // Redis is optional — don't retry
});

// Only log once, not repeatedly
let redisErrorLogged = false;
redisConnection.on('error', () => {
  if (!redisErrorLogged) {
    redisErrorLogged = true;
    console.warn('⚠️  Redis unavailable — running without BullMQ queue (direct processing mode)');
  }
});

redisConnection.on('connect', () => {
  redisAvailable = true;
  console.log('✅ Redis connected');
});

export const generationQueue = new Queue('ai-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

export { redisAvailable };
