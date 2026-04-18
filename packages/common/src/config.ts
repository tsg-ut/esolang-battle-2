/**
 * Shared Infrastructure Configurations
 */

// Redis Connection Settings
const getRedisUrl = () => {
  if (typeof (globalThis as any).process !== 'undefined') {
    const process = (globalThis as any).process;
    if (process.env.REDIS_URL) return process.env.REDIS_URL;
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6379';
    return `redis://${host}:${port}`;
  }
  return 'redis://localhost:6379';
};

export const REDIS_CONFIG = {
  url: getRedisUrl(),
  options: {
    maxRetriesPerRequest: null, // Required by BullMQ
  },
};

// Default BullMQ Job Options
export const DEFAULT_JOB_OPTIONS = {
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
