import { Job, Worker } from 'bullmq';
import 'dotenv/config';

import { syncBoardWithSubmissions } from './jobs/board.js';
import { processSubmission } from './jobs/submission.js';
import { TestJobData, processTest } from './jobs/test.js';
import { connection } from './queue.js';

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

console.log('Worker started (submission, test, board-update)...');
