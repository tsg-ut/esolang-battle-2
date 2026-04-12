import { PrismaClient } from '../../../prisma/generated/client/index';

/**
 * コンテストIDからボードを取得する
 */
export async function findBoardByContestId(prisma: PrismaClient, contestId: number) {
  return await prisma.board.findUnique({
    where: { contestId },
  });
}

/**
 * ボードの状態を直接更新する
 */
export async function updateBoardState(
  prisma: PrismaClient,
  boardId: number,
  data: {
    state: any;
    lastProcessedSubmissionId?: number | null;
  }
) {
  return await prisma.board.update({
    where: { id: boardId },
    data: {
      ...data,
      lastUpdated: new Date(),
    },
  });
}

/**
 * ボードの全データを更新する
 */
export async function upsertBoardData(prisma: PrismaClient, data: {
  id: number | null;
  contestId: number;
  type: string;
  config: any;
  state: any;
}) {
  const { id, ...payload } = data;
  if (id) {
    return await prisma.board.update({
      where: { id },
      data: payload,
    });
  } else {
    return await prisma.board.create({
      data: payload,
    });
  }
}
