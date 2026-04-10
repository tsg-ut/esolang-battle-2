import {
  listProblemsSchema,
  upsertProblemSchema,
  updateUserTeamSchema
} from '@esolang-battle/common';
import { 
  findAllUsersWithTeams, 
  findAllTeams, 
  findAllProblems, 
  upsertProblem,
  updateUserTeam,
  findUserByIdWithTeams
} from '@esolang-battle/db';
import { router, adminProcedure } from '../trpc';

export const adminRouter = router({
  getUsers: adminProcedure.query(async ({ ctx }) => {
    const users = await findAllUsersWithTeams(ctx.prisma);
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      isAdmin: Boolean(u.isAdmin),
      teams: u.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
    }));
  }),
  getTeams: adminProcedure.query(async ({ ctx }) => {
    return await findAllTeams(ctx.prisma);
  }),
  getProblems: adminProcedure
    .input(listProblemsSchema.optional())
    .query(async ({ ctx, input }) => {
      const problems = await findAllProblems(ctx.prisma, input?.contestId);
      return problems.map((p) => ({
        id: p.id,
        contestId: p.contestId,
        title: p.title,
        problemStatement: p.problemStatement,
      }));
    }),
  upsertProblem: adminProcedure
    .input(upsertProblemSchema)
    .mutation(async ({ ctx, input }) => {
      return await upsertProblem(ctx.prisma, input);
    }),
  updateUserTeam: adminProcedure
    .input(updateUserTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, teamId } = input;
      const user = await findUserByIdWithTeams(ctx.prisma, userId);
      if (!user) throw new Error("User not found");

      return await updateUserTeam(ctx.prisma, userId, teamId);
    }),
});
