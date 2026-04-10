import "dotenv/config";
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@esolang-battle/db';
import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// --- Types ---
type SubmissionJobData = {
  submissionId: number;
};

type DockerResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
};

type TestCaseWithIO = {
  id: number;
  input: string;
};

// --- Infrastructure ---
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
const docker = new Docker();

// --- Logic (Ported from apps/backend) ---

async function runAllTestCasesInSingleContainer(
  image: string,
  code: string,
  testCases: TestCaseWithIO[],
): Promise<Record<number, DockerResult>> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "esolang-worker-"));
  const cmd = image.split("/").slice(-1)[0];

  try {
    const codeFileName = "code.bf"; // 仮のファイル名
    const codePath = path.join(tmpDir, codeFileName);
    await fs.writeFile(codePath, code, "utf8");

    const scriptLines: string[] = [];
    for (const tc of testCases) {
      const base = String(tc.id);
      const inputPath = path.join(tmpDir, `INPUT_${base}`);
      await fs.writeFile(inputPath, tc.input, "utf8");

      scriptLines.push(
        `${cmd} /volume/${codeFileName} < /volume/INPUT_${base} > /volume/OUTPUT_${base} 2>/volume/ERR_${base}; echo $? > /volume/EXIT_${base}`,
      );
    }

    const scriptPath = path.join(tmpDir, "run_all.sh");
    await fs.writeFile(scriptPath, scriptLines.join("\n"), { mode: 0o755 });

    const container = await docker.createContainer({
      Image: image,
      Cmd: ["sh", "/volume/run_all.sh"],
      HostConfig: {
        Binds: [`${tmpDir}:/volume:rw`],
      },
    });

    const start = Date.now();
    await container.start();
    await container.wait();
    const end = Date.now();
    await container.remove({ force: true });

    const results: Record<number, DockerResult> = {};
    for (const tc of testCases) {
      const base = String(tc.id);
      const outPath = path.join(tmpDir, `OUTPUT_${base}`);
      const errPath = path.join(tmpDir, `ERR_${base}`);
      const exitPath = path.join(tmpDir, `EXIT_${base}`);

      const [stdoutBuf, stderrBuf, exitText] = await Promise.all([
        fs.readFile(outPath).catch(() => Buffer.alloc(0)),
        fs.readFile(errPath).catch(() => Buffer.alloc(0)),
        fs.readFile(exitPath, "utf8").catch(() => "-1"),
      ]);

      const exitCode = parseInt(String(exitText).trim(), 10);
      results[tc.id] = {
        stdout: stdoutBuf.toString("utf8"),
        stderr: stderrBuf.toString("utf8"),
        exitCode: Number.isNaN(exitCode) ? -1 : exitCode,
        durationMs: end - start,
      };
    }
    return results;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function processSubmission(submissionId: number) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      language: true,
      problem: { include: { testCases: true } },
    },
  });

  if (!submission || !submission.problem) return;

  const image = submission.language.dockerImageId;
  if (!image) return;

  const dockerResults = await runAllTestCasesInSingleContainer(
    image,
    submission.code,
    submission.problem.testCases.map((tc) => ({ id: tc.id, input: tc.input })),
  );

  let isAC = true;
  for (const testcase of submission.problem.testCases) {
    const result = dockerResults[testcase.id]!;
    let status: "AC" | "WA" | "RE";

    if (result.exitCode === 0) {
      const resultStdOut = result.stdout.trim().split(/\s+/);
      const expectedStdOut = testcase.output.trim().split(/\s+/);
      status = (resultStdOut.length === expectedStdOut.length && 
                resultStdOut.every((v, i) => v === expectedStdOut[i])) ? "AC" : "WA";
    } else {
      status = "RE";
    }

    if (status !== "AC") isAC = false;

    await prisma.execution.create({
      data: {
        testcase: { connect: { id: testcase.id } },
        submission: { connect: { id: submission.id } },
        status,
        stdout: result.stdout,
        stderr: result.stderr,
        executionTime: result.durationMs,
        executedAt: new Date(),
      },
    });
  }

  if (isAC) {
    await prisma.submission.update({
      where: { id: submission.id },
      data: { score: submission.codeLength },
    });
    // TODO: updateBoardFromSubmissions(boardId) を呼び出す
  }
}

// --- Worker ---
const worker = new Worker<SubmissionJobData>('submission', async (job: Job<SubmissionJobData>) => {
  console.log(`Processing job ${job.id} for submission ${job.data.submissionId}`);
  await processSubmission(job.data.submissionId);
}, { connection });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`);
});

console.log('Worker started...');
