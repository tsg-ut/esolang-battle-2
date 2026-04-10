import { prisma } from '@esolang-battle/db';
import { runAllTestCasesInSingleContainer } from '../lib/docker';

export async function processSubmission(submissionId: number) {
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
  } else {
    await prisma.submission.update({
      where: { id: submission.id },
      data: { score: 0 },
    });
  }
}
