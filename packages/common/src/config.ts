/**
 * Shared Infrastructure Configurations
 */

// Redis Connection Settings
export const REDIS_CONFIG = {
  url:
    typeof (globalThis as any).process !== 'undefined'
      ? (globalThis as any).process.env.REDIS_URL || 'redis://localhost:6379'
      : 'redis://localhost:6379',
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
