import { contestIdSchema } from '@esolang-battle/common';
import { findAllContests } from '@esolang-battle/db';

import { getBoard } from '../function/getBoard';
import { publicProcedure, router } from '../trpc';

export const contestRouter = router({
  getContests: publicProcedure.query(async ({ ctx }) => {
    const contests = await findAllContests(ctx.prisma);
    return contests.map((c) => ({
      id: c.id,
      name: c.name,
      startAt: c.startAt.toISOString(),
      endAt: c.endAt.toISOString(),
    }));
  }),
  getBoard: publicProcedure.input(contestIdSchema).query(async ({ ctx, input }) => {
    return await getBoard(ctx.prisma, input.contestId);
  }),
  getContest: publicProcedure.input(contestIdSchema).query(async ({ ctx, input }) => {
    const contest = await ctx.prisma.contest.findUnique({
      where: { id: input.contestId },
    });
    if (!contest) throw new Error('Contest not found');
    return {
      id: contest.id,
      name: contest.name,
      startAt: contest.startAt.toISOString(),
      endAt: contest.endAt.toISOString(),
    };
  }),
  getTeams: publicProcedure.input(contestIdSchema).query(async ({ ctx, input }) => {
    return await ctx.prisma.team.findMany({
      where: { contestId: input.contestId },
      select: { id: true, name: true, color: true },
    });
  }),
  getStandings: publicProcedure.input(contestIdSchema).query(async ({ ctx, input }) => {
    const contestId = input.contestId;

    // 1. 全問題を取得
    const problems = await ctx.prisma.problem.findMany({
      where: { contestId },
      select: { id: true, title: true },
      orderBy: { id: 'asc' },
    });

    // 2. 全ユーザーとチーム情報を取得
    const users = await ctx.prisma.user.findMany({
      where: {
        teams: {
          some: { contestId },
        },
      },
      include: {
        teams: {
          where: { contestId },
        },
      },
    });

    const teams = await ctx.prisma.team.findMany({
      where: { contestId },
    });

    // 3. 有効な提出（スコアがあるもの）をすべて取得
    const submissions = await ctx.prisma.submission.findMany({
      where: {
        problem: { contestId },
        score: { not: null },
      },
      select: {
        userId: true,
        problemId: true,
        score: true,
      },
    });

    // --- 個人順位の計算 ---
    const userStandings = users.map((user) => {
      const problemScores: Record<number, number> = {};
      problems.forEach((p) => (problemScores[p.id] = 0));

      // 各問題の最高スコアを計算
      submissions
        .filter((s) => s.userId === user.id)
        .forEach((s) => {
          if ((s.score ?? 0) > (problemScores[s.problemId] ?? 0)) {
            problemScores[s.problemId] = s.score ?? 0;
          }
        });

      const totalScore = Object.values(problemScores).reduce((a, b) => a + b, 0);

      return {
        userId: user.id,
        userName: user.name,
        teamName: user.teams[0]?.name || user.teams[0]?.color || 'None',
        problemScores,
        totalScore,
      };
    });

    // スコア降順でソート
    userStandings.sort((a, b) => b.totalScore - a.totalScore);

    // --- チーム順位の計算 ---
    const teamStandings = teams.map((team) => {
      const teamUserIds = users
        .filter((u) => u.teams.some((t) => t.id === team.id))
        .map((u) => u.id);

      const problemScores: Record<number, number> = {};
      problems.forEach((p) => (problemScores[p.id] = 0));

      // チームメンバー内での各問題の最高スコアを計算
      submissions
        .filter((s) => teamUserIds.includes(s.userId))
        .forEach((s) => {
          if ((s.score ?? 0) > (problemScores[s.problemId] ?? 0)) {
            problemScores[s.problemId] = s.score ?? 0;
          }
        });

      const totalScore = Object.values(problemScores).reduce((a, b) => a + b, 0);

      return {
        teamId: team.id,
        teamName: team.name || team.color,
        teamColor: team.color,
        problemScores,
        totalScore,
      };
    });

    teamStandings.sort((a, b) => b.totalScore - a.totalScore);

    return {
      problems,
      userStandings,
      teamStandings,
    };
  }),
});
