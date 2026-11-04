import { TRPCError } from '@trpc/server';
import { randomUUID } from 'node:crypto';

import { MAX_CONCURRENT_EXECUTIONS_PER_USER, getExecutionSlotKey } from '@esolang-battle/common';

import { connection } from '../queue';

// 解放されなかった枠が残り続けないように、一定時間で失効させる
const EXECUTION_SLOT_TTL_MS = 5 * 60 * 1000; // 5min

const ACQUIRE_EXECUTION_SLOT_SCRIPT = `
local time = redis.call('TIME')
local now = time[1] * 1000 + math.floor(time[2] / 1000)
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now)
if redis.call('ZCARD', KEYS[1]) >= tonumber(ARGV[1]) then
  return 0
end
redis.call('ZADD', KEYS[1], now + tonumber(ARGV[2]), ARGV[3])
redis.call('PEXPIRE', KEYS[1], ARGV[2])
return 1
`;

/**
 * コードテストや提出の実行枠を確保する。空きがなければ TOO_MANY_REQUESTS を投げる
 */
export async function acquireExecutionSlot(userId: string): Promise<string> {
  const slotId = randomUUID();
  const acquired = await connection.eval(
    ACQUIRE_EXECUTION_SLOT_SCRIPT,
    1,
    getExecutionSlotKey(userId),
    MAX_CONCURRENT_EXECUTIONS_PER_USER,
    EXECUTION_SLOT_TTL_MS,
    slotId
  );

  if (acquired !== 1) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `同時に実行できるコードテストと提出は合計 ${MAX_CONCURRENT_EXECUTIONS_PER_USER} 件までです。実行中の処理が終わってから再度お試しください。`,
    });
  }

  return slotId;
}

export async function releaseExecutionSlot(userId: string, slotId: string) {
  await connection.zrem(getExecutionSlotKey(userId), slotId);
}
