import { PrismaClient } from "@esolang-battle/db";

export async function getSubmissionDetail(
  prisma: PrismaClient,
  submissionId: number,
  userId: number,
  isAdmin: boolean,
) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      language: true,
      problem: true,
      executions: {
        include: {
          testcase: true,
        },
        orderBy: {
          testcaseId: "asc",
        },
      },
    },
  });

  if (!submission) {
    return null;
  }

  // 本人または管理者のみ詳細（コード等）を閲覧可能
  if (!isAdmin && submission.userId !== userId) {
    return null;
  }

  return {
    id: submission.id,
    code: submission.code,
    codeLength: submission.codeLength,
    score: submission.score,
    submittedAt: submission.submittedAt,
    language: {
      id: submission.language.id,
      name: submission.language.name,
      description: submission.language.description,
    },
    problem: {
      id: submission.problem.id,
      title: submission.problem.title,
    },
    executions: submission.executions.map((e) => ({
      testcaseId: e.testcaseId,
      status: e.status,
      stdout: e.stdout,
      stderr: e.stderr,
      executionTime: e.executionTime,
      executedAt: e.executedAt,
      testcase: {
        id: e.testcase.id,
        input: e.testcase.input,
        output: e.testcase.output,
        isSample: e.testcase.isSample,
      },
    })),
  };
}
