import { TRPCError } from '@trpc/server';

import { PrismaClient } from '@esolang-battle/db';

export const CONTEST_NOT_STARTED_MESSAGE =
  'コンテストはまだ開始していません。開始時刻になると表示されます。';

/**
 * ユーザーが特定のコンテストにアクセス可能か判定し、不可ならエラーを投げる
 *
 * - 管理者は常にアクセス可能
 * - 非公開のコンテストは見せない
 * - 開始前のコンテストは、問題・盤面・順位表・提出などの中身を見せない。
 *   コンテスト名や時刻など開始前に表示してよい情報だけを返す場合は allowBeforeStart を指定する
 *
 * どの場合も NOT_FOUND を投げる (外部クライアントは 404 を「まだ見られない」として扱える)
 */
export async function ensureContestAccess(
  prisma: PrismaClient,
  contestId: number,
  user: { id: string; isAdmin: boolean } | undefined,
  options: { allowBeforeStart?: boolean } = {}
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

  // 非公開のコンテストは一般ユーザーには見せない
  if (!contest.isPublic) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Contest not found',
    });
  }

  // 開始前のコンテストの中身は一般ユーザーには見せない
  if (!options.allowBeforeStart && new Date() < contest.startAt) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: CONTEST_NOT_STARTED_MESSAGE,
    });
  }
}
