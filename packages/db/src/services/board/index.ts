import { BoardState, BoardSubmission, getBoardEngine } from '@esolang-battle/common';

import { PrismaClient } from '../../../prisma/generated/client/index';

export async function findBoardByContestId(prisma: PrismaClient, contestId: number) {
  return await prisma.board.findUnique({
    where: { contestId },
  });
}

/**
 * 提出に基づいてボードの状態を更新する
 */
export async function updateBoardFromSubmission(
  prisma: PrismaClient,
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
  if (!submission.score) return; // 正解でない場合は更新不要

  const engine = getBoardEngine(board.type);
  const state = board.state as BoardState;
  const config = board.config as any;

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

/**
 * 全提出からボードを再計算する
 */
export async function recalculateBoard(prisma: PrismaClient, boardId: number) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error(`Board not found: ${boardId}`);

  const engine = getBoardEngine(board.type);
  let state = engine.createInitialState(board.config as any);

  const submissions = await prisma.submission.findMany({
    where: {
      problem: { contestId: board.contestId },
      score: { not: null },
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

  for (const submission of submissions) {
    state = engine.calculateUpdate(
      board.config as any,
      state,
      submission as unknown as BoardSubmission
    );
  }

  await prisma.board.update({
    where: { id: boardId },
    data: {
      state,
      lastUpdated: new Date(),
      lastProcessedSubmissionId: submissions[submissions.length - 1]?.id || null,
    },
  });
}

// 既存の関数との互換性のために残す
export async function updateBoardData(prisma: PrismaClient, contestId: number, data: any) {
  return await prisma.board.update({
    where: { contestId },
    data,
  });
}
