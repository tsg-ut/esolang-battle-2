import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { getSubmissions } from '../function/getSubmissions.js';
import { getLanguages } from '../function/getLanguages.js';
import { testCode } from '../function/testCode.js';
import { getSubmittableLanguageIdsForTeam } from '../function/getSubmittableLanguages.js';
import { submitCode } from '../function/submitCode.js';
import { submissionQueue } from '../queue.js';

export const submissionRouter = router({
  getSubmissions: publicProcedure
    .input(z.object({
      userId: z.number().optional(),
      teamId: z.number().optional(),
      problemId: z.number().optional(),
      languageId: z.number().optional(),
      contestId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return await getSubmissions(ctx.prisma, input ?? {});
    }),
  getLanguages: publicProcedure.query(async ({ ctx }) => {
    return await getLanguages(ctx.prisma);
  }),
  testCode: publicProcedure
    .input(z.object({
      code: z.string(),
      languageId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await testCode(ctx.prisma, input);
    }),
  getSubmittableLanguageIdsForTeam: protectedProcedure
    .input(z.object({ teamId: z.number(), contestId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getSubmittableLanguageIdsForTeam(ctx.prisma, input.teamId, input.contestId);
    }),
  submitCode: protectedProcedure
    .input(z.object({
      code: z.string(),
      languageId: z.number(),
      problemId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const submission = await submitCode(ctx.prisma, {
        ...input,
        userId: ctx.user.id,
      });
      await submissionQueue.add('evaluate', { submissionId: submission.id });
      return submission;
    }),
});
