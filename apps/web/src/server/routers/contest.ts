import { contestIdSchema } from '@esolang-battle/common';
import { findAllContests } from '@esolang-battle/db';
import { router, publicProcedure } from '../trpc';
import { getBoard } from '../function/getBoard';

export const contestRouter = router({
  getContests: publicProcedure.query(async ({ ctx }) => {
    const contests = await findAllContests(ctx.prisma);
    return contests.map((c) => ({
      id: c.id,
      name: c.name,
      viewerType: c.viewerType,
      startAt: c.startAt.toISOString(),
      endAt: c.endAt.toISOString(),
    }));
  }),
  getBoard: publicProcedure
    .input(contestIdSchema)
    .query(async ({ ctx, input }) => {
      return await getBoard(ctx.prisma, input.contestId);
    }),
});
