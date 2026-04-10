import {
  listProblemsSchema,
  upsertProblemSchema,
  updateUserTeamSchema
} from '@esolang-battle/common';
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
    .input(listProblemsSchema.optional())
    .query(async ({ ctx, input }) => {
      return await listProblems(ctx.prisma, input?.contestId);
    }),
  upsertProblem: adminProcedure
    .input(upsertProblemSchema)
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
    .input(updateUserTeamSchema)
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
