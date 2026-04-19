import { getAvatarUrl } from '@/utils/user';

import { contestIdSchema } from '@esolang-battle/common';

import { ensureContestAccess } from '../function/contest';
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
    await ensureContestAccess(ctx.prisma, input.contestId, ctx.user);
    return await getBoard(ctx.prisma, input.contestId);
  }),
  getContest: publicProcedure.input(contestIdSchema).query(async ({ ctx, input }) => {
    await ensureContestAccess(ctx.prisma, input.contestId, ctx.user);
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
    await ensureContestAccess(ctx.prisma, input.contestId, ctx.user);
    return await ctx.prisma.team.findMany({
      where: { contestId: input.contestId },
      select: { id: true, name: true, color: true },
    });
  }),
  getStandings: publicProcedure.input(contestIdSchema).query(async ({ ctx, input }) => {
    const contestId = input.contestId;
    await ensureContestAccess(ctx.prisma, contestId, ctx.user);

    const contest = await ctx.prisma.contest.findUnique({
      where: { id: contestId },
      select: { scoreOrder: true },
    });
    const isAsc = contest?.scoreOrder === 'ASC';

    const problems = await ctx.prisma.problem.findMany({
      where: { contestId },
      select: { id: true, title: true },
      orderBy: { id: 'asc' },
    });

    const users = await ctx.prisma.user.findMany({
      where: {
        teams: { some: { contestId } },
      },
      include: {
        teams: { where: { contestId } },
      },
    });

    const teams = await ctx.prisma.team.findMany({
      where: { contestId },
    });

    // AC かつ スコアがある提出のみを取得
    const submissions = await ctx.prisma.submission.findMany({
      where: {
        problem: { contestId },
        status: 'AC',
        score: { not: null },
      },
      select: {
        userId: true,
        problemId: true,
        score: true,
      },
    });

    // --- 個人順位の計算 ---
    let userStandings: any[] = users.map((user) => {
      const problemScores: Record<number, number | null> = {};
      problems.forEach((p) => (problemScores[p.id] = null));

      submissions
        .filter((s) => s.userId === user.id)
        .forEach((s) => {
          const score = s.score as number;
          const current = problemScores[s.problemId];

          if (current === null) {
            problemScores[s.problemId] = score;
          } else {
            if (isAsc) {
              if (score < current) problemScores[s.problemId] = score;
            } else {
              if (score > current) problemScores[s.problemId] = score;
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

    userStandings.sort((a, b) => {
      if (a.solvedCount !== b.solvedCount) return b.solvedCount - a.solvedCount;
      return isAsc ? a.totalScore - b.totalScore : b.totalScore - a.totalScore;
    });

    // 同率順位の付与 (1-2-2-4 方式)
    userStandings = userStandings.map((u, i, arr) => {
      if (
        i > 0 &&
        u.solvedCount === arr[i - 1].solvedCount &&
        u.totalScore === arr[i - 1].totalScore
      ) {
        u.rank = arr[i - 1].rank;
      } else {
        u.rank = i + 1;
      }
      return u;
    });

    // --- チーム順位の計算 ---
    let teamStandings: any[] = teams.map((team) => {
      const teamUserIds = users
        .filter((u) => u.teams.some((t) => t.id === team.id))
        .map((u) => u.id);

      const problemScores: Record<number, number | null> = {};
      problems.forEach((p) => (problemScores[p.id] = null));

      submissions
        .filter((s) => teamUserIds.includes(s.userId))
        .forEach((s) => {
          const score = s.score as number;
          const current = problemScores[s.problemId];

          if (current === null) {
            problemScores[s.problemId] = score;
          } else {
            if (isAsc) {
              if (score < current) problemScores[s.problemId] = score;
            } else {
              if (score > current) problemScores[s.problemId] = score;
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
      if (a.solvedCount !== b.solvedCount) return b.solvedCount - a.solvedCount;
      return isAsc ? a.totalScore - b.totalScore : b.totalScore - a.totalScore;
    });

    // 同率順位の付与
    teamStandings = teamStandings.map((t, i, arr) => {
      if (
        i > 0 &&
        t.solvedCount === arr[i - 1].solvedCount &&
        t.totalScore === arr[i - 1].totalScore
      ) {
        t.rank = arr[i - 1].rank;
      } else {
        t.rank = i + 1;
      }
      return t;
    });

    return {
      problems,
      userStandings,
      teamStandings,
    };
  }),
});
