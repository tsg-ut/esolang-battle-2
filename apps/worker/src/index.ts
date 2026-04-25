import { Job, Worker } from 'bullmq';
import 'dotenv/config';

import { syncBoardWithSubmissions } from './jobs/board';
import { DecathlonJobData, processDecathlonSubmission } from './jobs/decathlon';
import { processSubmission } from './jobs/submission';
import { TestJobData, processTest } from './jobs/test';
import { connection } from './queue';

// --- Types ---
type SubmissionJobData = {
  submissionId: number;
};

type BoardUpdateJobData = {
  boardId: number;
};

// --- Workers ---

const submissionWorker = new Worker<SubmissionJobData>(
  'submission',
  async (job: Job<SubmissionJobData>) => {
    console.log(`Processing submission ${job.data.submissionId}`);
    await processSubmission(job.data.submissionId);
  },
  { connection }
);

const testWorker = new Worker<TestJobData>(
  'test',
  async (job: Job<TestJobData>) => {
    console.log(`Processing test code for language ${job.data.languageId}`);
    if (job.name === 'runTest') {
      return await processTest(job.data);
    }
  },
  { connection }
);

const boardUpdateWorker = new Worker<BoardUpdateJobData>(
  'board-update',
  async (job: Job<BoardUpdateJobData>) => {
    console.log(`Syncing board ${job.data.boardId}...`);
    await syncBoardWithSubmissions(job.data.boardId);
  },
  { connection, concurrency: 1 }
);

const decathlonWorker = new Worker<DecathlonJobData>(
  'decathlon',
  async (job: Job<DecathlonJobData>) => {
    console.log(`Processing decathlon submission ${job.data.submissionId}`);
    await processDecathlonSubmission(job.data);
  },
  { connection }
);

// --- Events ---

submissionWorker.on('completed', (job) => {
  console.log(`Submission job ${job.id} completed!`);
});

testWorker.on('completed', (job) => {
  console.log(`Test job ${job.id} completed!`);
});

boardUpdateWorker.on('completed', (job) => {
  console.log(`Board update job ${job.id} completed!`);
});

submissionWorker.on('failed', (job, err) => {
  console.error(`Submission job ${job?.id} failed with ${err.message}`);
});

testWorker.on('failed', (job, err) => {
  console.error(`Test job ${job?.id} failed with ${err.message}`);
});

boardUpdateWorker.on('failed', (job, err) => {
  console.error(`Board update job ${job?.id} failed with ${err.message}`);
});

decathlonWorker.on('completed', (job: Job<DecathlonJobData>) => {
  console.log(`Decathlon job ${job.id} completed!`);
});

decathlonWorker.on('failed', (job: Job<DecathlonJobData> | undefined, err: Error) => {
  console.error(`Decathlon job ${job?.id} failed with ${err.message}`);
});

console.log('Worker started (submission, test, board-update, decathlon)...');
