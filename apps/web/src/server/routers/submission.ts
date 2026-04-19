import { getAvatarUrl } from '@/utils/user';
import { z } from 'zod';

import {
  submissionFilterSchema,
  submissionIdSchema,
  submitCodeSchema,
  submittableLanguageSchema,
  testCodeSchema,
} from '@esolang-battle/common';
import {
  createSubmission,
  findAllLanguages,
  findSubmissionDetail,
  findSubmissions,
} from '@esolang-battle/db';

import { ensureContestAccess } from '../function/contest';
import { getSubmittableLanguageIdsForTeam } from '../function/getSubmittableLanguages';
import { submissionQueue, testQueue, testQueueEvents } from '../queue';
import { protectedProcedure, publicProcedure, router } from '../trpc';

export const submissionRouter = router({
  getSubmissions: protectedProcedure.input(submissionFilterSchema).query(async ({ ctx, input }) => {
    const contestId = input?.contestId;

    // 1. アクセス制限の適用
    if (contestId) {
      await ensureContestAccess(ctx.prisma, contestId, ctx.user);
    } else if (!ctx.user.isAdmin) {
      // コンテストIDがない場合、一般ユーザーは自分の提出のみに制限
      input = { ...input, userId: ctx.user.id };
    }

    // 2. フィルタの構築
    const filter = { ...input };

    if (contestId) {
      const contest = await ctx.prisma.contest.findUnique({
        where: { id: contestId },
      });
      const isOver = contest ? new Date() > new Date(contest.endAt) : false;
      const isAdmin = !!ctx.user.isAdmin;

      if (!isAdmin && !isOver) {
        // コンテスト中は自チームの提出のみ表示
        const myTeam = ctx.user.teams.find((t: any) => t.contestId === contestId);
        const myTeamId = myTeam?.id;

        if (filter.teamId) {
          if (filter.teamId !== myTeamId) {
            filter.teamId = myTeamId ?? -1;
          }
        } else if (filter.userId) {
          if (filter.userId !== ctx.user.id) {
            filter.userId = ctx.user.id;
          }
        } else {
          // フィルタがない場合は自チームに制限
          filter.teamId = myTeamId ?? -1;
        }
      }
    }

    // 3. 取得とアバター変換
    const results = await findSubmissions(ctx.prisma, filter);
    return results.map((s) => ({
      ...s,
      user: {
        ...s.user,
        image: getAvatarUrl(s.user.id, !!s.user.image),
      },
    }));
  }),
  getLanguages: publicProcedure.query(async ({ ctx }) => {
    return await findAllLanguages(ctx.prisma);
  }),
  getLanguage: publicProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    return await ctx.prisma.language.findUnique({
      where: { id: input.id },
    });
  }),
  getSubmissionDetail: protectedProcedure
    .input(submissionIdSchema)
    .query(async ({ ctx, input }) => {
      const submission = (await findSubmissionDetail(ctx.prisma, input.submissionId)) as any;
      if (!submission) return null;

      const contestId = submission.problem?.contestId;
      if (contestId) {
        await ensureContestAccess(ctx.prisma, contestId, ctx.user);
      }

      const contest = submission.problem?.contest;
      const isOver = contest ? new Date() > new Date(contest.endAt) : false;
      const isAdmin = !!ctx.user.isAdmin;
      const isOwner = submission.userId === ctx.user.id;

      const submitterTeam = submission.user?.teams?.find((t: any) => t.contestId === contestId);
      const myTeam = ctx.user.teams?.find((t: any) => t.contestId === contestId);
      const isTeammate = !!(submitterTeam && myTeam && submitterTeam.id === myTeam.id);

      if (!isAdmin && !isOver && !isOwner && !isTeammate) return null;

      return {
        id: submission.id,
        codeText: submission.codeText as string | null,
        codeBase64: submission.codeBase64 as string,
        isBinary: !!submission.isBinary,
        codeLength: submission.codeLength,
        score: submission.score,
        status: submission.status,
        message: submission.message,
        submittedAt: submission.submittedAt,
        language: {
          id: submission.language.id,
          name: submission.language.name,
          description: submission.language.description,
        },
        problem: {
          id: submission.problem.id,
          title: submission.problem.title,
        },
        executions: submission.executions.map((e: any) => ({
          testcaseId: e.testcaseId,
          status: e.status,
          stdout: e.stdout,
          stderr: e.stderr,
          message: e.message,
          executionTime: e.executionTime,
          executedAt: e.executedAt,
          testcase: {
            id: e.testcase.id,
            input: e.testcase.input,
            output: e.testcase.output,
            isSample: e.testcase.isSample,
          },
        })),
      };
    }),
  testCode: publicProcedure.input(testCodeSchema).mutation(async ({ input }) => {
    const job = await testQueue.add('runTest', input);
    return await job.waitUntilFinished(testQueueEvents);
  }),
  getSubmittableLanguageIdsForTeam: protectedProcedure
    .input(submittableLanguageSchema)
    .query(async ({ ctx, input }) => {
      return await getSubmittableLanguageIdsForTeam(ctx.prisma, input.teamId, input.contestId);
    }),
  submitCode: protectedProcedure.input(submitCodeSchema).mutation(async ({ ctx, input }) => {
    const submission = await createSubmission(ctx.prisma, {
      ...input,
      userId: ctx.user.id,
    });
    await submissionQueue.add('evaluate', { submissionId: submission.id });
    return submission;
  }),
});
