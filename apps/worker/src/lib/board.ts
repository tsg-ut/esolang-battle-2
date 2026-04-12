import { BoardState, BoardSubmission, getBoardEngine } from '@esolang-battle/common';
import { prisma } from '@esolang-battle/db';

/**
 * 1つの提出に基づいてボードを更新するロジック (Worker向け)
 */
export async function updateBoardFromSubmission(
  boardId: number,
  submissionId: number
) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error(`Board not found: ${boardId}`);

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
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

  if (!submission) throw new Error(`Submission not found: ${submissionId}`);
  if (!submission.score || submission.score <= 0) return; // 正解でない場合は更新不要

  const engine = getBoardEngine(board.type);
  const config = board.config as any;
  let state = board.state as BoardState;

  // state が空、またはターゲットのセルが存在しない場合は初期状態で補完する
  const targetCellId = engine.getTargetCellId(config, submission as unknown as BoardSubmission);
  if (Object.keys(state).length === 0 || (targetCellId && !state[targetCellId])) {
    const initialState = engine.createInitialState(config);
    state = { ...initialState, ...state };
  }

  const newState = engine.calculateUpdate(config, state, submission as unknown as BoardSubmission);

  await prisma.board.update({
    where: { id: boardId },
    data: {
      state: newState,
      lastUpdated: new Date(),
      lastProcessedSubmissionId: submissionId,
    },
  });
}
