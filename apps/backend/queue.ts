import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: {
    count: 500,
  },
};

export const submissionQueue = new Queue('submission', { 
  connection,
  defaultJobOptions,
});

export const testQueue = new Queue('test', { 
  connection,
  defaultJobOptions,
});

export const testQueueEvents = new QueueEvents('test', { connection });
