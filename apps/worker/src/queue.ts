import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

import { DEFAULT_JOB_OPTIONS, REDIS_CONFIG } from '@esolang-battle/common';

export const connection = new Redis(REDIS_CONFIG.url, REDIS_CONFIG.options);

export const boardUpdateQueue = new Queue('board-update', {
  connection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});
