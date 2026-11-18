import { IBoardEngine } from '../types';
import { CrossGridBoardEngine } from './crossgrid';
import { GridBoardEngine } from './grid';
import { HoneycombBoardEngine } from './honeycomb';
import { RankingTableBoardEngine } from './rankingtable';
import { TeamTargetBoardEngine } from './teamtarget';

const engines: Record<string, IBoardEngine<any>> = {
  GRID: new GridBoardEngine(),
  HONEYCOMB: new HoneycombBoardEngine(),
  CROSS_GRID: new CrossGridBoardEngine(),
  TEAM_TARGET: new TeamTargetBoardEngine(),
  RANKING_TABLE: new RankingTableBoardEngine(),
};

export function getBoardEngine(type: string): IBoardEngine<any> {
  const engine = engines[type];
  if (!engine) throw new Error(`Board engine not found for type: ${type}`);
  return engine;
}
