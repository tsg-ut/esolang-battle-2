import { z } from 'zod';

import {
  BoardConfig,
  BoardState,
  listProblemsSchema,
  updateUserTeamSchema,
  upsertContestSchema,
  upsertLanguageSchema,
  upsertProblemSchema,
  upsertTeamSchema,
  upsertTestCaseSchema,
} from '@esolang-battle/common';
import {
  createTeam,
  deleteProblem,
  deleteTestCase,
  findTestCasesByProblemId,
  recalculateBoard,
  updateTeam,
  upsertTestCase,
} from '@esolang-battle/db';

import { submissionQueue } from '../queue';
import { adminProcedure, router } from '../trpc';

export const adminRouter = router({
  // Users
  adminGetUsers: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findMany({
      orderBy: { id: 'asc' },
      include: { teams: true },
    });
  }),
  adminGetUser: adminProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const { findUserByIdWithTeams } = await import('@esolang-battle/db');
    const user = await findUserByIdWithTeams(ctx.prisma, input.id);
    if (!user) throw new Error('User not found');
    return {
      id: user.id,
      name: user.name,
      isAdmin: Boolean(user.isAdmin),
      teams: user.teams.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        contestId: t.contestId,
      })),
    };
  }),
  adminCreateUser: adminProcedure
    .input(z.object({ name: z.string(), password: z.string(), isAdmin: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { registerUser } = await import('@esolang-battle/db');
      const user = await registerUser(ctx.prisma, input.name, input.password);
      if (input.isAdmin) {
        await ctx.prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
      }
      return user;
    }),
  adminUpdateUser: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        isAdmin: z.boolean().optional(),
        password: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, password, ...data } = input;
      let passwordHash = undefined;
      if (password) {
        const bcrypt = await import('bcryptjs');
        passwordHash = await bcrypt.hash(password, 10);
      }
      return await ctx.prisma.user.update({
        where: { id },
        data: {
          ...data,
          password: passwordHash,
        },
      });
    }),
  adminUpdateUserTeam: adminProcedure
    .input(updateUserTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, teamId } = input;
      const { findUserByIdWithTeams } = await import('@esolang-battle/db');
      const user = await findUserByIdWithTeams(ctx.prisma, userId);
      if (!user) throw new Error('User not found');

      // 既存の所属を解除
      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          teams: {
            set: teamId ? [{ id: teamId }] : [],
          },
        },
      });
      return { success: true };
    }),
  adminDeleteUser: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.delete({ where: { id: input.id } });
    }),
  adminDeleteUsers: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.deleteMany({ where: { id: { in: input.ids } } });
    }),

  // Contests
  adminGetContests: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.contest.findMany({ orderBy: { id: 'asc' } });
  }),
  adminGetContest: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.contest.findUnique({
        where: { id: input.id },
      });
    }),
  adminUpsertContest: adminProcedure.input(upsertContestSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) {
      return await ctx.prisma.contest.update({ where: { id }, data });
    } else {
      return await ctx.prisma.contest.create({ data });
    }
  }),
  adminDeleteContest: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.contest.delete({ where: { id: input.id } });
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
      return await ctx.prisma.team.delete({ where: { id: input.id } });
    }),
  adminDeleteTeams: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.team.deleteMany({ where: { id: { in: input.ids } } });
    }),

  // Languages
  adminGetLanguages: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.language.findMany({ orderBy: { id: 'asc' } });
  }),
  adminGetLanguage: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.language.findUnique({ where: { id: input.id } });
    }),
  adminUpsertLanguage: adminProcedure
    .input(upsertLanguageSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) {
        return await ctx.prisma.language.update({ where: { id }, data });
      } else {
        return await ctx.prisma.language.create({ data });
      }
    }),
  adminDeleteLanguage: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.language.delete({ where: { id: input.id } });
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
        checkerConfig: problem.checkerConfig as any,
        aggregatorConfig: problem.aggregatorConfig as any,
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
        config: board.config as unknown as BoardConfig,
        state: board.state as unknown as BoardState,
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
        config: board.config as unknown as BoardConfig,
        state: board.state as unknown as BoardState,
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

  // Submissions
  adminGetSubmissions: adminProcedure.query(async ({ ctx }) => {
    const subs = await ctx.prisma.submission.findMany({
      orderBy: { id: 'desc' },
      include: {
        problem: { include: { contest: true } },
        language: true,
        user: true,
      },
    });
    return subs.map((s) => ({
      ...s,
      contestName: s.problem.contest.name,
      problemTitle: s.problem.title,
      languageName: s.language.name,
      userName: s.user.name,
    }));
  }),
  adminGetSubmission: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const sub = await ctx.prisma.submission.findUnique({
        where: { id: input.id },
        include: {
          problem: { include: { contest: true } },
          language: true,
          user: true,
        },
      });
      if (!sub) throw new Error('Submission not found');
      return {
        ...sub,
        contestName: sub.problem.contest.name,
      };
    }),
  adminDeleteSubmission: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // executions を先に削除
      await ctx.prisma.execution.deleteMany({ where: { submissionId: input.id } });
      return await ctx.prisma.submission.delete({
        where: { id: input.id },
      });
    }),
  adminDeleteSubmissions: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.execution.deleteMany({ where: { submissionId: { in: input.ids } } });
      return await ctx.prisma.submission.deleteMany({
        where: { id: { in: input.ids } },
      });
    }),
  adminUpdateSubmission: adminProcedure
    .input(
      z.object({
        id: z.number(),
        userId: z.number().optional(),
        submittedAt: z.coerce.date().optional(),
        status: z.enum(['AC', 'WA', 'TLE', 'RE', 'WJ']).optional(),
        score: z.number().nullable().optional(),
        code: z.string().optional(),
        languageId: z.number().optional(),
        problemId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, code, ...data } = input;
      return await ctx.prisma.submission.update({
        where: { id },
        data: {
          ...data,
          code,
          codeLength: code ? code.length : undefined,
        },
      });
    }),
  adminRejudgeSubmissions: adminProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const submissions = await ctx.prisma.submission.findMany({
        where: { id: { in: input.ids } },
      });

      for (const sub of submissions) {
        await ctx.prisma.submission.update({
          where: { id: sub.id },
          data: { status: 'WJ', score: null },
        });
        await submissionQueue.add('evaluate', { submissionId: sub.id });
      }
      return { success: true, count: submissions.length };
    }),
});
