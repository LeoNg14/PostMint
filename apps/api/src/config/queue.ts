import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
});

export const videoQueue = new Queue('video-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const videoQueueEvents = new QueueEvents('video-generation', { connection });

export { connection as queueConnection };
