import { BoardState, BoardSubmission, HoneycombBoardConfig } from '../types';
import { BaseBoardEngine } from './base';

export class HoneycombBoardEngine extends BaseBoardEngine<HoneycombBoardConfig> {
  getTargetCellId(config: HoneycombBoardConfig, submission: BoardSubmission): string | null {
    return config.mapping[String(submission.languageId)] || null;
  }

  getAdjacentCellIds(config: HoneycombBoardConfig, cellId: string): string[] {
    const info = config.cellInfo[cellId];
    if (!info) return [];

    const { q, r } = info;
    const directions = [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ];

    const adjacentIds: string[] = [];
    for (const [dq, dr] of directions) {
      const targetQ = q + dq;
      const targetR = r + dr;
      // cellInfo を走査して一致する q, r を探す (非効率だが、configの構造上やむなし)
      const adjId = Object.keys(config.cellInfo).find((id) => {
        const c = config.cellInfo[id];
        return c.q === targetQ && c.r === targetR;
      });
      if (adjId) adjacentIds.push(adjId);
    }
    return adjacentIds;
  }

  createInitialState(config: HoneycombBoardConfig): BoardState {
    const state: BoardState = {};
    for (const id of config.cellIds) {
      state[id] = { ownerTeamIds: [], submissionIds: [], score: null };
    }

    if (config.startingPositions) {
      for (const [teamIdStr, cellIds] of Object.entries(config.startingPositions)) {
        const teamId = parseInt(teamIdStr, 10);
        for (const cellId of cellIds as string[]) {
          if (state[cellId]) {
            if (!state[cellId].ownerTeamIds.includes(teamId)) {
              state[cellId].ownerTeamIds.push(teamId);
              state[cellId].ownerTeamIds.sort((a, b) => a - b);
            }
          }
        }
      }
    }
    return state;
  }
}
