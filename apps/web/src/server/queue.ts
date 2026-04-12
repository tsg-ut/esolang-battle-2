import { Queue, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

import { DEFAULT_JOB_OPTIONS, REDIS_CONFIG } from '@esolang-battle/common';

export const connection = new Redis(REDIS_CONFIG.url, REDIS_CONFIG.options);

export const submissionQueue = new Queue('submission', {
  connection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export const boardUpdateQueue = new Queue('board-update', {
  connection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export const testQueue = new Queue('test', {
  connection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export const testQueueEvents = new QueueEvents('test', { connection });
