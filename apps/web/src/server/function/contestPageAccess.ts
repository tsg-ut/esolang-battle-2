import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { TRPCError } from '@trpc/server';

import { prisma } from '@esolang-battle/db';

import { ensureContestAccess } from './contest';

/**
 * サーバーコンポーネントのページ用のアクセスチェック。
 * tRPC を経由せずに DB を読むページ (盤面など) でも、API と同じ条件で表示を制限する。
 */
export async function checkContestPageAccess(
  contestId: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getServerSession(authOptions);
  try {
    await ensureContestAccess(prisma, contestId, session?.user);
    return { ok: true };
  } catch (e) {
    if (e instanceof TRPCError && e.code === 'NOT_FOUND') {
      return { ok: false, message: e.message };
    }
    throw e;
  }
}
