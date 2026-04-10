import {
  submissionFilterSchema,
  testCodeSchema,
  submittableLanguageSchema,
  submitCodeSchema,
  submissionIdSchema
} from '@esolang-battle/common';
import { 
  findSubmissions, 
  findSubmissionDetail, 
  createSubmission, 
  findAllLanguages 
} from '@esolang-battle/db';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { getSubmittableLanguageIdsForTeam } from '../function/getSubmittableLanguages';
import { submissionQueue, testQueue, testQueueEvents } from '../queue';

export const submissionRouter = router({
  getSubmissions: publicProcedure
    .input(submissionFilterSchema)
    .query(async ({ ctx, input }) => {
      return await findSubmissions(ctx.prisma, input ?? {});
    }),
  getLanguages: publicProcedure.query(async ({ ctx }) => {
    return await findAllLanguages(ctx.prisma);
  }),
  getSubmissionDetail: protectedProcedure
    .input(submissionIdSchema)
    .query(async ({ ctx, input }) => {
      const submission = await findSubmissionDetail(ctx.prisma, input.submissionId);
      if (!submission) return null;
      if (!ctx.user.isAdmin && submission.userId !== Number(ctx.user.id)) return null;

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
    }),
  testCode: publicProcedure
    .input(testCodeSchema)
    .mutation(async ({ input }) => {
      const job = await testQueue.add('runTest', input);
      return await job.waitUntilFinished(testQueueEvents);
    }),
  getSubmittableLanguageIdsForTeam: protectedProcedure
    .input(submittableLanguageSchema)
    .query(async ({ ctx, input }) => {
      return await getSubmittableLanguageIdsForTeam(ctx.prisma, input.teamId, input.contestId);
    }),
  submitCode: protectedProcedure
    .input(submitCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const submission = await createSubmission(ctx.prisma, {
        ...input,
        userId: Number(ctx.user.id),
      });
      await submissionQueue.add('evaluate', { submissionId: submission.id });
      return submission;
    }),
});

