import { BoardState, BoardSubmission, CrossGridBoardConfig } from '../types';
import { BaseBoardEngine } from './base';

export class CrossGridBoardEngine extends BaseBoardEngine<CrossGridBoardConfig> {
  getTargetCellId(config: CrossGridBoardConfig, submission: BoardSubmission): string | null {
    // CrossGrid では problemId と languageId の組み合わせがセルになる
    // ID 形式: p_{problemId}_l_{languageId}
    if (
      config.problemIds.includes(submission.problemId) &&
      config.languageIds.includes(submission.languageId)
    ) {
      return `p_${submission.problemId}_l_${submission.languageId}`;
    }
    return null;
  }

  getAdjacentCellIds(_config: CrossGridBoardConfig, _cellId: string): string[] {
    // CrossGrid は隣接ルールがない（すべてのセルが独立して占領可能）ため、常に空
    return [];
  }

  // CrossGrid 特有のオーバーライド: 隣接チェックをスキップして常に占領可能にする
  calculateUpdate(
    config: CrossGridBoardConfig,
    state: BoardState,
    submission: BoardSubmission,
    scoreOrder: 'ASC' | 'DESC'
  ): BoardState {
    const targetCellId = this.getTargetCellId(config, submission);
    if (!targetCellId || !state[targetCellId]) return state;

    const cell = state[targetCellId];
    const team = submission.user.teams[0];
    if (!team) return state;

    const subScore = submission.score ?? 0;
    const allowMultiOwner = config.allowMultiOwner ?? false;

    let shouldReplaceOwners = false;
    let isSameScore = false;

    if (cell.score === null) {
      shouldReplaceOwners = true;
    } else {
      if (scoreOrder === 'ASC') {
        if (subScore < cell.score) shouldReplaceOwners = true;
        else if (subScore === cell.score) isSameScore = true;
      } else {
        if (subScore > cell.score) shouldReplaceOwners = true;
        else if (subScore === cell.score) isSameScore = true;
      }
    }

    // CrossGrid は隣接チェックなしでスコア条件のみで更新
    if (shouldReplaceOwners) {
      return {
        ...state,
        [targetCellId]: {
          ownerTeamIds: [team.id],
          score: subScore,
          submissionIds: [submission.id],
        },
      };
    } else if (isSameScore && allowMultiOwner) {
      if (!cell.ownerTeamIds.includes(team.id)) {
        return {
          ...state,
          [targetCellId]: {
            ...cell,
            ownerTeamIds: [...cell.ownerTeamIds, team.id].sort(),
          },
        };
      }
    }

    return state;
  }

  createInitialState(config: CrossGridBoardConfig): BoardState {
    const state: BoardState = {};
    for (const pid of config.problemIds) {
      for (const lid of config.languageIds) {
        state[`p_${pid}_l_${lid}`] = { ownerTeamIds: [], score: null, submissionIds: [] };
      }
    }

    if (config.startingPositions) {
      for (const [teamIdStr, cellIds] of Object.entries(config.startingPositions)) {
        const teamId = parseInt(teamIdStr, 10);
        for (const cellId of cellIds as string[]) {
          if (state[cellId]) {
            state[cellId] = { ownerTeamIds: [teamId], score: null, submissionIds: [] };
          }
        }
      }
    }
    return state;
  }
}
