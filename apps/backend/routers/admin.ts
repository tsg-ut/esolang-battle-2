import { z } from 'zod';
import { router, adminProcedure } from '../trpc.js';
import { getUsersWithTeams } from '../function/getUsers.js';
import { getTeams } from '../function/getTeams.js';
import { listProblems } from '../function/listProblems.js';

export const adminRouter = router({
  getUsers: adminProcedure.query(async ({ ctx }) => {
    return await getUsersWithTeams(ctx.prisma);
  }),
  getTeams: adminProcedure.query(async ({ ctx }) => {
    return await getTeams(ctx.prisma);
  }),
  getProblems: adminProcedure
    .input(z.object({ contestId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return await listProblems(ctx.prisma, input?.contestId);
    }),
  upsertProblem: adminProcedure
    .input(z.object({
      id: z.number().nullable(),
      contestId: z.number(),
      title: z.string(),
      problemStatement: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) {
        return await ctx.prisma.problem.update({
          where: { id },
          data,
        });
      } else {
        return await ctx.prisma.problem.create({
          data,
        });
      }
    }),
  updateUserTeam: adminProcedure
    .input(z.object({
      userId: z.number(),
      teamId: z.number().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, teamId } = input;
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        include: { teams: true },
      });
      if (!user) throw new Error("User not found");

      return await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          teams: {
            set: teamId ? [{ id: teamId }] : [],
          },
        },
        include: {
          teams: true,
        },
      });
    }),
});
