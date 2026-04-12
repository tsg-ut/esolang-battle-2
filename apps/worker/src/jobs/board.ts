import { BoardState, BoardSubmission, getBoardEngine } from '@esolang-battle/common';
import { prisma } from '@esolang-battle/db';

/**
 * ボードの未処理の提出を順次反映する (Sequential Sync)
 *
 * ジャッジ完了順ではなく、提出ID順（提出時刻順）に盤面を更新するためのコアロジックです。
 */
export async function syncBoardWithSubmissions(boardId: number) {
  return await prisma.$transaction(async (tx) => {
    const board = await tx.board.findUnique({
      where: { id: boardId },
    });

    if (!board) throw new Error(`Board not found: ${boardId}`);

    const lastId = board.lastProcessedSubmissionId ?? 0;

    // 未処理の提出（WJ以外も含めて全て）を古い順に取得
    const nextSubmissions = await tx.submission.findMany({
      where: {
        id: { gt: lastId },
        problem: { contestId: board.contestId },
      },
      orderBy: { id: 'asc' },
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

    if (nextSubmissions.length === 0) return;

    const engine = getBoardEngine(board.type);
    const config = board.config as any;
    let currentState = board.state as BoardState;
    let lastProcessedId = lastId;

    for (const sub of nextSubmissions) {
      // 重要: 順序を守るため、まだジャッジ中の提出にぶつかったらそこで停止する
      if (sub.status === 'WJ') {
        console.log(
          `[BoardSync] Board ${boardId}: Submission ${sub.id} is still WJ. Stopping sync to preserve order.`
        );
        break;
      }

      // AC (またはスコアがある) の場合のみ盤面を更新
      if (sub.score !== null && sub.score > 0) {
        const targetCellId = engine.getTargetCellId(config, sub as unknown as BoardSubmission);

        // 必要に応じて初期状態で補完 (セルの初期化が必要なエンジン用)
        if (
          Object.keys(currentState).length === 0 ||
          (targetCellId && !currentState[targetCellId])
        ) {
          const initialState = engine.createInitialState(config);
          currentState = { ...initialState, ...currentState };
        }

        currentState = engine.calculateUpdate(
          config,
          currentState,
          sub as unknown as BoardSubmission
        );
      }

      lastProcessedId = sub.id;
    }

    // 実際に進展があった場合のみDBを更新
    if (lastProcessedId !== lastId) {
      await tx.board.update({
        where: { id: boardId },
        data: {
          state: currentState,
          lastProcessedSubmissionId: lastProcessedId,
          lastUpdated: new Date(),
        },
      });
      console.log(
        `[BoardSync] Board ${boardId}: Successfully synced up to submission ${lastProcessedId}`
      );
    }
  });
}
