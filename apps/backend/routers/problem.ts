import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { getProblem } from '../function/getProblem.js';
import { listProblems } from '../function/listProblems.js';

export const problemRouter = router({
  getProblem: publicProcedure
    .input(z.object({ problemId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getProblem(ctx.prisma, input.problemId);
    }),
  listProblems: publicProcedure
    .input(z.object({ contestId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return await listProblems(ctx.prisma, input.contestId);
    }),
});
