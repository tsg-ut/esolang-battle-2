import {runAllTestCasesInSingleContainer} from '../lib/docker.js';
import {db} from '../lib/firestore.js';

export type DecathlonJobData = {
  gameId: string;
  submissionId: string;
  imageId: string;
  code: string;
  testcases: {stdin: string}[];
  codeEncoding?: 'utf-8' | 'base64';
};

export async function processDecathlonSubmission(data: DecathlonJobData) {
  let results: {stdout: string; stderr: string; durationMs: number; exitCode: number}[] = [];
  let error: string | null = null;

  try {
    const dockerResults = await runAllTestCasesInSingleContainer(
      data.imageId,
      Buffer.from(data.code, data.codeEncoding ?? 'utf-8'),
      data.testcases.map((tc, i) => ({id: i, input: tc.stdin})),
    );

    results = data.testcases.map((_, i) => {
      const r = dockerResults[i];
      if (!r) {
        return {stdout: '', stderr: 'Execution result missing', durationMs: 0, exitCode: -1};
      }
      return {stdout: r.stdout, stderr: r.stderr, durationMs: r.durationMs, exitCode: r.exitCode};
    });
  } catch (err: unknown) {
    error = String(err instanceof Error ? err.message : err);
  }

  await db.doc(`executions/${data.submissionId}`).set({
    gameId: data.gameId,
    submissionId: data.submissionId,
    results,
    error,
    completedAt: new Date(),
  });
}
