import { BoardConfig, BoardState, BoardSubmission, IBoardEngine } from '../types';

export abstract class BaseBoardEngine<
  TConfig extends BoardConfig,
> implements IBoardEngine<TConfig> {
  abstract getAdjacentCellIds(config: TConfig, cellId: string): string[];
  abstract getTargetCellId(config: TConfig, submission: BoardSubmission): string | null;

  calculateUpdate(config: TConfig, state: BoardState, submission: BoardSubmission): BoardState {
    const targetCellId = this.getTargetCellId(config, submission);
    if (!targetCellId || !state[targetCellId]) return state;

    const cell = state[targetCellId];
    const team = submission.user.teams[0];
    if (!team) return state;

    if (cell.score !== null && submission.codeLength >= cell.score) {
      return state;
    }

    const isAdjacentToOwned = this.isAdjacentToTeam(config, state, targetCellId, team.id);
    const isStartingCell = this.isStartingCell(config, targetCellId, team.id);

    if (isAdjacentToOwned || isStartingCell) {
      return {
        ...state,
        [targetCellId]: {
          ownerTeamId: team.id,
          score: submission.codeLength,
          submissionId: submission.id,
        },
      };
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
    return adjacents.some((id) => state[id]?.ownerTeamId === teamId);
  }

  protected isStartingCell(config: TConfig, cellId: string, teamId: number): boolean {
    const startingCells = (config.startingPositions?.[String(teamId)] || []) as string[];
    return startingCells.includes(cellId);
  }

  abstract createInitialState(config: TConfig): BoardState;
}
