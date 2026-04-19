import { TRPCError } from '@trpc/server';

import { PrismaClient } from '@esolang-battle/db';

/**
 * ユーザーが特定のコンテストにアクセス可能か判定し、不可ならエラーを投げる
 */
export async function ensureContestAccess(
  prisma: PrismaClient,
  contestId: number,
  user: { id: string; isAdmin: boolean } | undefined
) {
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { isPublic: true, startAt: true },
  });

  if (!contest) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Contest not found',
    });
  }

  // 管理者は常にOK
  if (user?.isAdmin) return;

  // 非公開、または開始前のコンテストは一般ユーザーには見せない
  if (!contest.isPublic) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Contest not found',
    });
  }
}
