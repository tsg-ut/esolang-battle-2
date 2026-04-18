import { BoardConfig, BoardState, BoardSubmission, IBoardEngine } from '../types';

export abstract class BaseBoardEngine<
  TConfig extends BoardConfig,
> implements IBoardEngine<TConfig> {
  abstract getAdjacentCellIds(config: TConfig, cellId: string): string[];
  abstract getTargetCellId(config: TConfig, submission: BoardSubmission): string | null;

  calculateUpdate(
    config: TConfig,
    state: BoardState,
    submission: BoardSubmission,
    scoreOrder: 'ASC' | 'DESC'
  ): BoardState {
    const targetCellId = this.getTargetCellId(config, submission);
    if (!targetCellId || !state[targetCellId]) return state;

    const cell = state[targetCellId];
    const team = submission.user.teams[0];
    if (!team) return state;

    // 言語指定がないセルは提出による占領を許可しない（初期拠点用）
    const cellInfo = (config as any).cellInfo?.[targetCellId];
    if (cellInfo && cellInfo.languageId === undefined) {
      return state;
    }

    const subScore = submission.score ?? 0;
    const allowMultiOwner = (config as any).allowMultiOwner ?? false;

    let shouldReplaceOwners = false;
    let isSameScore = false;

    // スコア比較ロジック
    if (cell.score === null) {
      shouldReplaceOwners = true;
    } else {
      if (scoreOrder === 'ASC') {
        if (subScore < cell.score) {
          shouldReplaceOwners = true;
        } else if (subScore === cell.score) {
          isSameScore = true;
        }
      } else {
        if (subScore > cell.score) {
          shouldReplaceOwners = true;
        } else if (subScore === cell.score) {
          isSameScore = true;
        }
      }
    }

    const isAdjacentToOwned = this.isAdjacentToTeam(config, state, targetCellId, team.id);
    const isStartingCell = this.isStartingCell(config, targetCellId, team.id);

    if (isAdjacentToOwned || isStartingCell) {
      if (shouldReplaceOwners) {
        // 新しい単独所有者
        return {
          ...state,
          [targetCellId]: {
            ownerTeamIds: [team.id],
            score: subScore,
            submissionId: submission.id,
          },
        };
      } else if (isSameScore && allowMultiOwner) {
        // 同じスコアで複数所有を許可する場合
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
    }

    return state;
  }

  protected isAdjacentToTeam(
    config: TConfig,
    state: BoardState,
    targetCellId: string,
    teamId: number
  ): boolean {
    const adjacents = this.getAdjacentCellIds(config, targetCellId);
    return adjacents.some((id) => {
      const cell = state[id];
      if (!cell) return false;
      return cell.ownerTeamIds.includes(teamId);
    });
  }

  protected isStartingCell(config: TConfig, cellId: string, teamId: number): boolean {
    const startingCells = (config.startingPositions?.[String(teamId)] || []) as string[];
    return startingCells.includes(cellId);
  }

  abstract createInitialState(config: TConfig): BoardState;

  recalculate(
    config: TConfig,
    initialState: BoardState,
    submissions: BoardSubmission[],
    scoreOrder: 'ASC' | 'DESC'
  ): BoardState {
    let state = initialState;
    for (const submission of submissions) {
      state = this.calculateUpdate(config, state, submission, scoreOrder);
    }
    return state;
  }
}
