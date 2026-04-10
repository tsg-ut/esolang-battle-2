import "dotenv/config";
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { processSubmission } from './jobs/submission';
import { processTest, TestJobData } from './jobs/test';

// --- Types ---
type SubmissionJobData = {
  submissionId: number;
};

// --- Infrastructure ---
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

// --- Workers ---

const submissionWorker = new Worker<SubmissionJobData>('submission', async (job: Job<SubmissionJobData>) => {
  console.log(`Processing submission ${job.data.submissionId}`);
  await processSubmission(job.data.submissionId);
}, { connection });

const testWorker = new Worker<TestJobData>('test', async (job: Job<TestJobData>) => {
  console.log(`Processing test code for language ${job.data.languageId}`);
  if (job.name === 'runTest') {
    return await processTest(job.data);
  }
}, { connection });

// --- Events ---

submissionWorker.on('completed', (job) => {
  console.log(`Submission job ${job.id} completed!`);
});

testWorker.on('completed', (job) => {
  console.log(`Test job ${job.id} completed!`);
});

submissionWorker.on('failed', (job, err) => {
  console.error(`Submission job ${job?.id} failed with ${err.message}`);
});

testWorker.on('failed', (job, err) => {
  console.error(`Test job ${job?.id} failed with ${err.message}`);
});

console.log('Worker started (submission & test)...');
