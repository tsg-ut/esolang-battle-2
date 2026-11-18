import {
  BoardState,
  BoardSubmission,
  TeamTargetBoardConfig,
  getTeamTargetCellScore,
  isTeamTargetGoalCell,
  matchesTeamTargetCell,
} from '../types';
import { BaseBoardEngine } from './base';

/**
 * TEAM_TARGET ボード
 *
 * 各セルに (チーム, 言語 and/or 問題) が割り当てられており、そのチームのメンバーが条件を満たす提出で
 * AC するとセルを獲得して config で指定された点数を得る。隣接ルールはなく、一度獲得したセルは失われない。
 * 同じセルに複数メンバーが AC した場合は全員の提出を記録する。
 * 1 つの提出が複数のセルの条件を満たす場合は、そのすべてに反映する。
 * 共有セル (shared: true) は、どのチームのメンバーでも条件を満たせば獲得でき、複数チームが所有できる。
 */
export class TeamTargetBoardEngine extends BaseBoardEngine<TeamTargetBoardConfig> {
  /** 提出が条件を満たすセルID をすべて返す */
  getTargetCellIds(config: TeamTargetBoardConfig, submission: BoardSubmission): string[] {
    const team = submission.user.teams[0];
    if (!team) return [];

    const target = {
      teamId: team.id,
      languageId: submission.languageId,
      problemId: submission.problemId,
    };
    return Object.entries(config.cells)
      .filter(([, cell]) => matchesTeamTargetCell(cell, target))
      .map(([cellId]) => cellId);
  }

  getTargetCellId(config: TeamTargetBoardConfig, submission: BoardSubmission): string | null {
    return this.getTargetCellIds(config, submission)[0] ?? null;
  }

  getAdjacentCellIds(): string[] {
    // 隣接ルールなし
    return [];
  }

  calculateUpdate(
    config: TeamTargetBoardConfig,
    state: BoardState,
    submission: BoardSubmission
  ): BoardState {
    // 部分点は想定しないため、score > 0 を AC とみなす (ワーカー側でも同条件で絞り込み済み)
    if (submission.score === null || submission.score <= 0) return state;

    let next = state;
    for (const cellId of this.getTargetCellIds(config, submission)) {
      const cellConfig = config.cells[cellId];
      // 共有セルは提出したチームを所有者に加える (getTargetCellIds で提出者のチームの存在は確認済み)
      const teamId = cellConfig.shared === true ? submission.user.teams[0].id : cellConfig.teamId;
      if (teamId === undefined) continue;

      const cell = next[cellId] ?? { ownerTeamIds: [], submissionIds: [], score: null };
      if (cell.submissionIds.includes(submission.id)) continue;

      const ownerTeamIds = cell.ownerTeamIds.includes(teamId)
        ? cell.ownerTeamIds
        : [...cell.ownerTeamIds, teamId].sort((a, b) => a - b);

      next = {
        ...next,
        [cellId]: {
          ownerTeamIds,
          submissionIds: [...cell.submissionIds, submission.id],
          score: getTeamTargetCellScore(config, cellConfig),
        },
      };
    }
    return next;
  }

  createInitialState(config: TeamTargetBoardConfig): BoardState {
    const state: BoardState = {};
    for (const [cellId, cell] of Object.entries(config.cells)) {
      if (cell.teamId === undefined && cell.shared !== true) continue; // ラベルセルは状態を持たない
      state[cellId] = {
        // 固定セル (言語・問題の指定なし) は最初からそのチームの所有
        ownerTeamIds: isTeamTargetGoalCell(cell) || cell.teamId === undefined ? [] : [cell.teamId],
        submissionIds: [],
        score: null,
      };
    }
    return state;
  }
}
