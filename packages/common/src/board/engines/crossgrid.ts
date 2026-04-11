import { BoardState, BoardSubmission, CrossGridBoardConfig } from '../types';
import { BaseBoardEngine } from './base';

export class CrossGridBoardEngine extends BaseBoardEngine<CrossGridBoardConfig> {
  getTargetCellId(config: CrossGridBoardConfig, submission: BoardSubmission): string | null {
    return `p_${submission.problemId}_l_${submission.languageId}`;
  }

  getAdjacentCellIds(config: CrossGridBoardConfig, cellId: string): string[] {
    const parts = cellId.split('_');
    const pId = parseInt(parts[1], 10);
    const lId = parseInt(parts[3], 10);

    const { problemIds, languageIds } = config;
    const pIdx = problemIds.indexOf(pId);
    const lIdx = languageIds.indexOf(lId);

    if (pIdx === -1 || lIdx === -1) return [];

    const adj: string[] = [];
    if (pIdx > 0) adj.push(`p_${problemIds[pIdx - 1]}_l_${lId}`);
    if (pIdx < problemIds.length - 1) adj.push(`p_${problemIds[pIdx + 1]}_l_${lId}`);
    if (lIdx > 0) adj.push(`p_${pId}_l_${languageIds[lIdx - 1]}`);
    if (lIdx < languageIds.length - 1) adj.push(`p_${pId}_l_${languageIds[lIdx + 1]}`);

    return adj;
  }

  createInitialState(config: CrossGridBoardConfig): BoardState {
    const state: BoardState = {};
    const { problemIds, languageIds } = config;
    for (const pId of problemIds) {
      for (const lId of languageIds) {
        state[`p_${pId}_l_${lId}`] = { ownerTeamId: null, score: null, submissionId: null };
      }
    }
    return state;
  }
}
