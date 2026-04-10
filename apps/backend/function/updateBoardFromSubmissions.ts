import type { OwnerColor } from "./getBoard.js";
import { PrismaClient } from "@esolang-battle/db";

/**
 * Board.lastProcessedSubmissionId より新しい Submission を反映して
 * Board.scoreOfLanguages / Board.colorOfLanguages / Board.lastProcessedSubmissionId
 * を更新するユーティリティ関数。
 *
 * 現在のルール（暫定）:
 * - Submission.score がその言語の現在スコアより小さい場合だけ更新する（コードゴルフ想定）。
 * - そのとき、その言語の色を Submission.user.team.color に更新する。
 * - チーム色が "red" / "blue" 以外の場合は "neutral" として扱う。
 */
export async function updateBoardFromSubmissions(prisma: PrismaClient, contestId: number): Promise<void> {
  const board = await prisma.board.findUnique({
    where: { contestId: contestId },
    include: {
      contest: true,
    },
  });

  if (!board) {
    throw new Error(`Board for contest ${contestId} not found`);
  }

  const lastProcessedId = board.lastProcessedSubmissionId ?? 0;

  // まだ処理していない Submission をすべて取得（この Board の contest に属するものだけ）。
  const newSubmissions = await prisma.submission.findMany({
    where: {
      id: { gt: lastProcessedId },
      problem: {
        contestId,
      },
    },
    include: {
      user: {
        include: {
          teams: true,
        },
      },
    },
    orderBy: [
      { submittedAt: "asc" },
      { id: "asc" },
    ],
  });

  if (newSubmissions.length === 0) {
    return;
  }

  // 既存のスコア・色設定をオブジェクトとして読み出す
  const scoreOfLanguages: Record<string, number> =
    (board.scoreOfLanguages as any as Record<string, number>) ?? {};
  const colorOfLanguages: Record<string, OwnerColor> =
    (board.colorOfLanguages as any as Record<string, OwnerColor>) ?? {};

  let maxSeenSubmissionId = lastProcessedId;

  for (const submission of newSubmissions) {
    const languageId = submission.languageId;
    const key = String(languageId);

    const currentScore = scoreOfLanguages[key] ?? Infinity;
    const newScore = submission.score;

    if (typeof newScore === "number" && newScore < currentScore) {
      scoreOfLanguages[key] = newScore;

      const team = submission.user.teams.find((t: any) => t.contestId === contestId);
      const rawColor = team?.color?.toLowerCase() ?? "neutral";
      const teamColor: OwnerColor =
        rawColor === "red" || rawColor === "blue" ? (rawColor as OwnerColor) : "neutral";
      colorOfLanguages[key] = teamColor;
    }

    if (submission.id > maxSeenSubmissionId) {
      maxSeenSubmissionId = submission.id;
    }
  }

  await prisma.board.update({
    where: { contestId: contestId },
    data: {
      scoreOfLanguages,
      colorOfLanguages,
      lastProcessedSubmissionId: maxSeenSubmissionId,
    },
  });
}

/**
 * 盤面を Submission からフル再計算するユーティリティ関数。
 *
 * - lastProcessedSubmissionId に関係なく、そのコンテストの全 Submission を読み出す。
 * - Board.scoreOfLanguages / Board.colorOfLanguages を空の状態から再構築する。
 * - lastProcessedSubmissionId を「処理した Submission の最大 id」に更新する（Submission が無ければ null）。
 */
export async function recomputeBoardFromSubmissions(prisma: PrismaClient, contestId: number): Promise<void> {
  const board = await prisma.board.findUnique({
    where: { contestId: contestId },
    include: {
      contest: true,
    },
  });

  if (!board) {
    throw new Error(`Board for contest ${contestId} not found`);
  }

  const submissions = await prisma.submission.findMany({
    where: {
      problem: {
        contestId,
      },
    },
    include: {
      user: {
        include: {
          teams: true,
        },
      },
    },
    orderBy: [
      { submittedAt: "asc" },
      { id: "asc" },
    ],
  });

  if (submissions.length === 0) {
    await prisma.board.update({
      where: { contestId: contestId },
      data: {
        scoreOfLanguages: {},
        colorOfLanguages: {},
        lastProcessedSubmissionId: null,
      },
    });
    return;
  }

  const scoreOfLanguages: Record<string, number> = {};
  const colorOfLanguages: Record<string, OwnerColor> = {};

  let maxSeenSubmissionId = 0;

  for (const submission of submissions) {
    const languageId = submission.languageId;
    const key = String(languageId);

    const currentScore = scoreOfLanguages[key] ?? Infinity;
    const newScore = submission.score;

    if (typeof newScore === "number" && newScore < currentScore) {
      scoreOfLanguages[key] = newScore;

      const team = submission.user.teams.find((t: any) => t.contestId === contestId);
      const rawColor = team?.color?.toLowerCase() ?? "neutral";
      const teamColor: OwnerColor =
        rawColor === "red" || rawColor === "blue" ? (rawColor as OwnerColor) : "neutral";
      colorOfLanguages[key] = teamColor;
    }

    if (submission.id > maxSeenSubmissionId) {
      maxSeenSubmissionId = submission.id;
    }
  }

  await prisma.board.update({
    where: { contestId: contestId },
    data: {
      scoreOfLanguages,
      colorOfLanguages,
      lastProcessedSubmissionId: maxSeenSubmissionId,
    },
  });
}
