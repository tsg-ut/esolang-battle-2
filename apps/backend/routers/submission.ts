import {
  submissionFilterSchema,
  testCodeSchema,
  submittableLanguageSchema,
  submitCodeSchema
} from '@esolang-battle/common';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { getSubmissions } from '../function/getSubmissions.js';
import { getLanguages } from '../function/getLanguages.js';
import { getSubmittableLanguageIdsForTeam } from '../function/getSubmittableLanguages.js';
import { submitCode } from '../function/submitCode.js';
import { submissionQueue, testQueue, testQueueEvents } from '../queue.js';

export const submissionRouter = router({
  getSubmissions: publicProcedure
    .input(submissionFilterSchema)
    .query(async ({ ctx, input }) => {
      return await getSubmissions(ctx.prisma, input ?? {});
    }),
  getLanguages: publicProcedure.query(async ({ ctx }) => {
    return await getLanguages(ctx.prisma);
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
      const submission = await submitCode(ctx.prisma, {
        ...input,
        userId: ctx.user.id,
      });
      await submissionQueue.add('evaluate', { submissionId: submission.id });
      return submission;
    }),
});
