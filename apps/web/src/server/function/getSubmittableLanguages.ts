import { BoardSubmission, getBoardEngine } from '@esolang-battle/common';
import { findBoardByContestId, PrismaClient } from '@esolang-battle/db';

/**
 * チームが現在提出可能な言語IDの一覧を取得する
 */
export async function getSubmittableLanguageIdsForTeam(
  prisma: PrismaClient,
  teamId: number,
  contestId: number
): Promise<number[]> {
  const board = await findBoardByContestId(prisma, contestId);
  if (!board) return [];

  const engine = getBoardEngine(board.type);
  const config = board.config as any;
  const state = board.state as any;

  // 全言語を取得して、それぞれの言語について提出可能かチェックする
  // 効率は悪いが、1言語=1セルの小規模なグリッドなら問題ない
  const languages = await prisma.language.findMany();
  const submittableIds: number[] = [];

  for (const lang of languages) {
    // この言語がボード上のどのセルに対応するか特定
    // BoardConfig の mapping は { [languageId]: cellId } の形式
    const cellId = config.mapping?.[String(lang.id)];
    if (!cellId) continue;

    // 隣接チェックのためにダミーの提出オブジェクトを作成
    const dummySubmission: BoardSubmission = {
      id: 0,
      problemId: 0,
      languageId: lang.id,
      userId: 0,
      codeLength: 0,
      score: null,
      user: {
        teams: [{ id: teamId, color: '', contestId }],
      },
    };

    // startingPositions に含まれているか、または隣接セルを所有しているかチェック
    const startingCells = (config.startingPositions?.[String(teamId)] || []) as string[];
    const isStarting = startingCells.includes(cellId);

    // state にセルが存在し、かつ隣接チェックを通るか
    if (isStarting || engine.getTargetCellId(config, dummySubmission)) {
      // calculateUpdate のロジックを模倣
      const isAdjacent = (engine as any).isAdjacentToTeam?.(config, state, cellId, teamId);
      if (isStarting || isAdjacent) {
        submittableIds.push(lang.id);
      }
    }
  }

  return submittableIds.sort((a, b) => a - b);
}
