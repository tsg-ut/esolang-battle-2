import { z } from 'zod';

import {
  listProblemsSchema,
  updateUserTeamSchema,
  upsertContestSchema,
  upsertLanguageSchema,
  upsertProblemSchema,
  upsertTeamSchema,
  upsertTestCaseSchema,
} from '@esolang-battle/common';
import {
  createContest,
  createLanguage,
  createTeam,
  deleteContest,
  deleteLanguage,
  deleteProblem,
  deleteTeam,
  deleteTestCase,
  findAllContests,
  findAllLanguages,
  findAllUsersWithTeams,
  findTestCasesByProblemId,
  findUserByIdWithTeams,
  recalculateBoard,
  updateContest,
  updateLanguage,
  updateTeam,
  updateUserTeam,
  upsertTestCase,
} from '@esolang-battle/db';

import { adminProcedure, router } from '../trpc';

export const adminRouter = router({
  // Users
  adminGetUsers: adminProcedure.query(async ({ ctx }) => {
    const users = await findAllUsersWithTeams(ctx.prisma);
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      isAdmin: Boolean(u.isAdmin),
      teams: u.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
    }));
  }),
  adminGetUser: adminProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const { findUserByIdWithTeams } = await import('@esolang-battle/db');
    const user = await findUserByIdWithTeams(ctx.prisma, input.id);
    if (!user) throw new Error('User not found');
    return {
      id: user.id,
      name: user.name,
      isAdmin: Boolean(user.isAdmin),
      teams: user.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
    };
  }),
  adminUpdateUserTeam: adminProcedure
    .input(updateUserTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, teamId } = input;
      const user = await findUserByIdWithTeams(ctx.prisma, userId);
      if (!user) throw new Error('User not found');
      return await updateUserTeam(ctx.prisma, userId, teamId);
    }),

  // Contests
  adminGetContests: adminProcedure.query(async ({ ctx }) => {
    return await findAllContests(ctx.prisma);
  }),
  adminGetContest: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { findContestById } = await import('@esolang-battle/db');
      const contest = await findContestById(ctx.prisma, input.id);
      if (!contest) throw new Error('Contest not found');
      return contest;
    }),
  adminUpsertContest: adminProcedure.input(upsertContestSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) {
      return await updateContest(ctx.prisma, id, data);
    } else {
      return await createContest(ctx.prisma, data);
    }
  }),
  adminDeleteContest: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await deleteContest(ctx.prisma, input.id);
    }),
  adminDeleteContests: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.contest.deleteMany({ where: { id: { in: input.ids } } });
    }),

  // Teams
  adminGetTeams: adminProcedure.query(async ({ ctx }) => {
    const teams = await ctx.prisma.team.findMany({
      orderBy: { id: 'asc' },
      include: { contest: true },
    });
    return teams.map((t) => ({
      ...t,
      contestName: t.contest.name,
    }));
  }),
  adminGetTeam: adminProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const team = await ctx.prisma.team.findUnique({
      where: { id: input.id },
      include: { contest: true },
    });
    if (!team) throw new Error('Team not found');
    return {
      ...team,
      contestName: team.contest.name,
    };
  }),
  adminUpsertTeam: adminProcedure.input(upsertTeamSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) {
      return await updateTeam(ctx.prisma, id, data);
    } else {
      return await createTeam(ctx.prisma, data);
    }
  }),
  adminDeleteTeam: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await deleteTeam(ctx.prisma, input.id);
    }),
  adminDeleteTeams: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.team.deleteMany({ where: { id: { in: input.ids } } });
    }),

  // Languages
  adminGetLanguages: adminProcedure.query(async ({ ctx }) => {
    return await findAllLanguages(ctx.prisma);
  }),
  adminGetLanguage: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { findLanguageById } = await import('@esolang-battle/db');
      const language = await findLanguageById(ctx.prisma, input.id);
      if (!language) throw new Error('Language not found');
      return language;
    }),
  adminUpsertLanguage: adminProcedure
    .input(upsertLanguageSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) {
        return await updateLanguage(ctx.prisma, id, data);
      } else {
        return await createLanguage(ctx.prisma, data);
      }
    }),
  adminDeleteLanguage: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await deleteLanguage(ctx.prisma, input.id);
    }),
  adminDeleteLanguages: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.language.deleteMany({ where: { id: { in: input.ids } } });
    }),

  // Problems
  adminGetProblems: adminProcedure
    .input(listProblemsSchema.optional())
    .query(async ({ ctx, input }) => {
      const problems = await ctx.prisma.problem.findMany({
        where: input?.contestId ? { contestId: input.contestId } : {},
        orderBy: { id: 'asc' },
        include: { contest: true },
      });
      return problems.map((p) => ({
        id: p.id,
        contestId: p.contestId,
        contestName: p.contest.name,
        title: p.title,
        problemStatement: p.problemStatement,
      }));
    }),
  adminGetProblem: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const problem = await ctx.prisma.problem.findUnique({
        where: { id: input.id },
        include: { contest: true, acceptedLanguages: true },
      });
      if (!problem) throw new Error('Problem not found');
      return {
        ...problem,
        contestName: problem.contest.name,
      };
    }),
  adminUpdateProblemLanguages: adminProcedure
    .input(z.object({ problemId: z.number(), languageIds: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.problem.update({
        where: { id: input.problemId },
        data: {
          acceptedLanguages: {
            set: input.languageIds.map((id) => ({ id })),
          },
        },
      });
    }),
  adminUpsertProblem: adminProcedure
    .input(upsertProblemSchema.extend({ languageIds: z.array(z.number()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, languageIds, ...data } = input;
      const problem = id
        ? await ctx.prisma.problem.update({
            where: { id },
            data: {
              ...data,
              acceptedLanguages: languageIds
                ? { set: languageIds.map((id) => ({ id })) }
                : undefined,
            },
          })
        : await ctx.prisma.problem.create({
            data: {
              ...data,
              acceptedLanguages: languageIds
                ? { connect: languageIds.map((id) => ({ id })) }
                : undefined,
            },
          });
      return problem;
    }),
  adminDeleteProblem: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await deleteProblem(ctx.prisma, input.id);
    }),
  adminDeleteProblems: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.problem.deleteMany({ where: { id: { in: input.ids } } });
    }),

  // TestCases
  adminGetTestCases: adminProcedure
    .input(z.object({ problemId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.problemId) {
        return await findTestCasesByProblemId(ctx.prisma, input.problemId);
      }
      return await ctx.prisma.testCase.findMany({ orderBy: { id: 'asc' } });
    }),
  adminGetTestCase: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { findTestCaseById } = await import('@esolang-battle/db');
      const testCase = await findTestCaseById(ctx.prisma, input.id);
      if (!testCase) throw new Error('TestCase not found');
      return testCase;
    }),
  adminUpsertTestCase: adminProcedure
    .input(upsertTestCaseSchema)
    .mutation(async ({ ctx, input }) => {
      return await upsertTestCase(ctx.prisma, input);
    }),
  adminDeleteTestCase: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await deleteTestCase(ctx.prisma, input.id);
    }),
  adminDeleteTestCases: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.testCase.deleteMany({ where: { id: { in: input.ids } } });
    }),

  // Board
  adminGetBoards: adminProcedure.query(async ({ ctx }) => {
    const boards = await ctx.prisma.board.findMany({
      orderBy: { id: 'asc' },
      include: { contest: true },
    });
    return boards.map((b) => ({
      ...b,
      contestName: b.contest.name,
    }));
  }),
  adminGetBoardByContestId: adminProcedure
    .input(z.object({ contestId: z.number() }))
    .query(async ({ ctx, input }) => {
      const board = await ctx.prisma.board.findUnique({
        where: { contestId: input.contestId },
        include: { contest: true },
      });
      if (!board) return null;
      return {
        ...board,
        contestName: board.contest.name,
      };
    }),
  adminGetBoard: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const board = await ctx.prisma.board.findUnique({
        where: { id: input.id },
        include: { contest: true },
      });
      if (!board) throw new Error('Board not found');
      return {
        ...board,
        contestName: board.contest.name,
      };
    }),
  adminUpsertBoard: adminProcedure
    .input(
      z.object({
        id: z.number().nullable(),
        contestId: z.number(),
        type: z.string(),
        config: z.any(),
        state: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) {
        return await ctx.prisma.board.update({
          where: { id },
          data,
        });
      } else {
        return await ctx.prisma.board.create({
          data,
        });
      }
    }),
  adminRecalculateBoard: adminProcedure
    .input(z.object({ boardId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await recalculateBoard(ctx.prisma, input.boardId);
    }),
});
