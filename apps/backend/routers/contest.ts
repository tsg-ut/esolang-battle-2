import { contestIdSchema } from '@esolang-battle/common';
import { router, publicProcedure } from '../trpc.js';
import { getContests } from '../function/getContests.js';
import { getBoard } from '../function/getBoard.js';

export const contestRouter = router({
  getContests: publicProcedure.query(async ({ ctx }) => {
    return await getContests(ctx.prisma);
  }),
  getBoard: publicProcedure
    .input(contestIdSchema)
    .query(async ({ ctx, input }) => {
      return await getBoard(ctx.prisma, input.contestId);
    }),
});
