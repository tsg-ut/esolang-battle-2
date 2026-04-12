import { BoardSubmission, getBoardEngine } from '@esolang-battle/common';
import { PrismaClient } from '@esolang-battle/db';

/**
 * 全提出からボードを再計算するロジック (Web/Admin向け)
 */
export async function recalculateBoardAction(prisma: PrismaClient, boardId: number) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error(`Board not found: ${boardId}`);

  const engine = getBoardEngine(board.type);
  const initialState = engine.createInitialState(board.config as any);

  const submissions = await prisma.submission.findMany({
    where: {
      problem: { contestId: board.contestId },
      score: { gt: 0 }, // 正解（スコアが0より大きい）のみ対象
    },
    orderBy: { submittedAt: 'asc' }, // 古い提出から順番に適用
    include: {
      user: {
        include: {
          teams: {
            where: { contestId: board.contestId },
          },
        },
      },
    },
  });

  const newState = engine.recalculate(
    board.config as any,
    initialState,
    submissions as unknown as BoardSubmission[]
  );

  await prisma.board.update({
    where: { id: boardId },
    data: {
      state: newState,
      lastUpdated: new Date(),
      lastProcessedSubmissionId: submissions[submissions.length - 1]?.id || null,
    },
  });
}
