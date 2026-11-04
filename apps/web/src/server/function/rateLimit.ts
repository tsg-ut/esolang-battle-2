import { TRPCError } from '@trpc/server';

import { connection } from '../queue';

const TEST_CODE_RATE_LIMIT = 10;
const TEST_CODE_RATE_LIMIT_WINDOW_SECONDS = 60;

/**
 * コードテストの実行回数をユーザーごとに制限する (固定ウィンドウ)
 */
export async function enforceTestCodeRateLimit(userId: string) {
  const key = `rate-limit:test-code:${userId}`;
  const results = await connection
    .multi()
    .incr(key)
    .expire(key, TEST_CODE_RATE_LIMIT_WINDOW_SECONDS, 'NX')
    .exec();

  const [incrError, count] = results?.[0] ?? [new Error('Rate limit check failed'), 0];
  if (incrError) throw incrError;

  if ((count as number) > TEST_CODE_RATE_LIMIT) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `コードテストは ${TEST_CODE_RATE_LIMIT_WINDOW_SECONDS} 秒あたり ${TEST_CODE_RATE_LIMIT} 回までです。しばらく待ってから再度実行してください。`,
    });
  }
}
