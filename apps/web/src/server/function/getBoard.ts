import { BoardData, BoardType } from '@esolang-battle/common';
import { PrismaClient, findBoardByContestId } from '@esolang-battle/db';

export async function getBoard(prisma: PrismaClient, contestId: number): Promise<BoardData> {
  const board = await findBoardByContestId(prisma, contestId);

  if (!board) {
    throw new Error(`Board for contest ${contestId} not found`);
  }

  return {
    id: board.id,
    contestId: board.contestId,
    type: board.type as BoardType,
    config: board.config,
    state: board.state as any,
    lastUpdated: board.lastUpdated.toISOString(),
  };
}
