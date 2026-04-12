import { getBoardEngine } from '@esolang-battle/common';
import { PrismaClient } from '@esolang-battle/db';

import { boardUpdateQueue } from '../queue';

/**
 * ボードを初期状態にリセットし、最初から同期し直す (Web/Admin向け)
 */
export async function recalculateBoardAction(prisma: PrismaClient, boardId: number) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error(`Board not found: ${boardId}`);

  const engine = getBoardEngine(board.type);
  const initialState = engine.createInitialState(board.config as any);

  // 1. ボードを初期化
  await prisma.board.update({
    where: { id: boardId },
    data: {
      state: initialState,
      lastProcessedSubmissionId: null,
      lastUpdated: new Date(),
    },
  });

  // 2. 同期ジョブをキューに投げる
  await boardUpdateQueue.add('recalculate', { boardId });

  console.log(`Board ${boardId} reset and recalculation job queued.`);
}
