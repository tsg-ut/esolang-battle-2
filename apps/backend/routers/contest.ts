import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { getContests } from '../function/getContests.js';
import { getBoard } from '../function/getBoard.js';

export const contestRouter = router({
  getContests: publicProcedure.query(async ({ ctx }) => {
    return await getContests(ctx.prisma);
  }),
  getBoard: publicProcedure
    .input(z.object({ contestId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getBoard(ctx.prisma, input.contestId);
    }),
});
