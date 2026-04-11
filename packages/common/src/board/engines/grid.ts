import { BoardState, BoardSubmission, GridBoardConfig } from '../types';
import { BaseBoardEngine } from './base';

export class GridBoardEngine extends BaseBoardEngine<GridBoardConfig> {
  getTargetCellId(config: GridBoardConfig, submission: BoardSubmission): string | null {
    return config.mapping[String(submission.languageId)] || null;
  }

  getAdjacentCellIds(config: GridBoardConfig, cellId: string): string[] {
    const [x, y] = cellId.split('_').map(Number);
    const { width, height } = config;
    const adj: string[] = [];
    if (x > 0) adj.push(`${x - 1}_${y}`);
    if (x < width - 1) adj.push(`${x + 1}_${y}`);
    if (y > 0) adj.push(`${x}_${y - 1}`);
    if (y < height - 1) adj.push(`${x}_${y + 1}`);
    return adj;
  }

  createInitialState(config: GridBoardConfig): BoardState {
    const state: BoardState = {};
    const { width, height } = config;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        state[`${x}_${y}`] = { ownerTeamId: null, score: null, submissionId: null };
      }
    }
    return state;
  }
}
