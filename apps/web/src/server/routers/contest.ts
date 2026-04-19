import { contestIdSchema } from '@esolang-battle/common';
import { getAvatarUrl } from '@/utils/user';

import { getBoard } from '../function/getBoard';
import { publicProcedure, router } from '../trpc';

export const contestRouter = router({
  getContests: publicProcedure.query(async ({ ctx }) => {
    // 管理者以外は公開されているコンテストのみ表示
    const where = ctx.user?.isAdmin ? {} : { isPublic: true };
    const contests = await ctx.prisma.contest.findMany({
      where,
      orderBy: { startAt: 'desc' },
    });
    return contests.map((c) => ({
      id: c.id,
      name: c.name,
      startAt: c.startAt.toISOString(),
      endAt: c.endAt.toISOString(),
      isPublic: c.isPublic,
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
      isPublic: contest.isPublic,
      scoreOrder: contest.scoreOrder,
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

    const contest = await ctx.prisma.contest.findUnique({
      where: { id: contestId },
      select: { scoreOrder: true },
    });
    const isAsc = contest?.scoreOrder === 'ASC';

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
    const rawSubmissions = await ctx.prisma.submission.findMany({
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

    // score が確実に number であることを保証する型ガード
    const submissions = rawSubmissions.filter(
      (s): s is typeof s & { score: number } => s.score !== null
    );

    // --- 個人順位の計算 ---
    const userStandings = users.map((user) => {
      const problemScores: Record<number, number | null> = {};
      problems.forEach((p) => (problemScores[p.id] = null));

      submissions
        .filter((s) => s.userId === user.id)
        .forEach((s) => {
          const { score, problemId } = s;
          const current = problemScores[problemId];

          if (current === null) {
            problemScores[problemId] = score;
          } else {
            if (isAsc) {
              if (score < current) problemScores[problemId] = score;
            } else {
              if (score > current) problemScores[problemId] = score;
            }
          }
        });

      const solvedCount = Object.values(problemScores).filter((v) => v !== null).length;
      const totalScore = Object.values(problemScores)
        .filter((v): v is number => v !== null)
        .reduce((a, b) => a + b, 0);

      return {
        userId: user.id,
        userName: user.name,
        userImage: getAvatarUrl(user.id, !!user.image),
        teamName: user.teams[0]?.name || user.teams[0]?.color || 'None',
        problemScores,
        solvedCount,
        totalScore,
      };
    });

    // ソート順の適用
    userStandings.sort((a, b) => {
      if (isAsc) {
        if (a.solvedCount !== b.solvedCount) {
          return b.solvedCount - a.solvedCount;
        }
        return a.totalScore - b.totalScore;
      } else {
        return b.totalScore - a.totalScore;
      }
    });

    // --- チーム順位の計算 ---
    const teamStandings = teams.map((team) => {
      const teamUserIds = users
        .filter((u) => u.teams.some((t) => t.id === team.id))
        .map((u) => u.id);

      const problemScores: Record<number, number | null> = {};
      problems.forEach((p) => (problemScores[p.id] = null));

      submissions
        .filter((s) => teamUserIds.includes(s.userId))
        .forEach((s) => {
          const { score, problemId } = s;
          const current = problemScores[problemId];

          if (current === null) {
            problemScores[problemId] = score;
          } else {
            if (isAsc) {
              if (score < current) problemScores[problemId] = score;
            } else {
              if (score > current) problemScores[problemId] = score;
            }
          }
        });

      const solvedCount = Object.values(problemScores).filter((v) => v !== null).length;
      const totalScore = Object.values(problemScores)
        .filter((v): v is number => v !== null)
        .reduce((a, b) => a + b, 0);

      return {
        teamId: team.id,
        teamName: team.name || team.color,
        teamColor: team.color,
        problemScores,
        solvedCount,
        totalScore,
      };
    });

    teamStandings.sort((a, b) => {
      if (isAsc) {
        if (a.solvedCount !== b.solvedCount) {
          return b.solvedCount - a.solvedCount;
        }
        return a.totalScore - b.totalScore;
      } else {
        return b.totalScore - a.totalScore;
      }
    });

    return {
      problems,
      userStandings,
      teamStandings,
    };
  }),
});
