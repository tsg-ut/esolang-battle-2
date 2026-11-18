import {
  BoardState,
  BoardSubmission,
  RankingTableBoardConfig,
  getRankingTableCellId,
  getRankingTableMultiplier,
  getRankingTableScore,
  matchesRankingTable,
  rankRankingTable,
} from '../types';
import { BaseBoardEngine } from './base';

/**
 * RANKING_TABLE ボード
 *
 * チームごとに最良の提出 (スコア・バイト数・言語) を 1 つ記録し、順位と得点を付けて表として表示する。
 * 最良はコンテストの scoreOrder で判定し、同じスコアなら先の提出を残す。
 * multipliers を設定すると、提出のスコアの代わりに バイト数 × 言語の係数 をスコアにする。
 * 対象の問題・言語 (チームごとの言語を含む) 以外の提出は無視する。隣接ルールはない。
 * 順位と得点は state の rank / points に保存する (提出のないチームの得点も入れる)。
 */
export class RankingTableBoardEngine extends BaseBoardEngine<RankingTableBoardConfig> {
  getTargetCellId(config: RankingTableBoardConfig, submission: BoardSubmission): string | null {
    const team = submission.user.teams[0];
    if (!team) return null;
    const target = {
      teamId: team.id,
      languageId: submission.languageId,
      problemId: submission.problemId,
    };
    return matchesRankingTable(config, target) ? getRankingTableCellId(team.id) : null;
  }

  getAdjacentCellIds(): string[] {
    return [];
  }

  calculateUpdate(
    config: RankingTableBoardConfig,
    state: BoardState,
    submission: BoardSubmission,
    scoreOrder: 'ASC' | 'DESC'
  ): BoardState {
    // score > 0 を AC とみなす (ワーカー側でも同条件で絞り込み済み)
    if (submission.score === null || submission.score <= 0) return state;
    const cellId = this.getTargetCellId(config, submission);
    if (!cellId) return state;

    const score = getRankingTableScore(config, submission);
    if (score === null) return state;

    const teamId = submission.user.teams[0].id;
    const cell = state[cellId] ?? { ownerTeamIds: [], submissionIds: [], score: null };
    const isBetter =
      cell.score === null || (scoreOrder === 'ASC' ? score < cell.score : score > cell.score);
    if (!isBetter) return state;

    return rankRankingTable(
      config,
      {
        ...state,
        [cellId]: {
          ownerTeamIds: [teamId],
          submissionIds: [submission.id],
          score,
          codeLength: submission.codeLength,
          languageId: submission.languageId,
          multiplier: getRankingTableMultiplier(config, submission.languageId),
        },
      },
      scoreOrder
    );
  }

  createInitialState(config: RankingTableBoardConfig): BoardState {
    // 提出がない状態では scoreOrder は順位に影響しない
    return rankRankingTable(config, {}, 'ASC');
  }
}
