import { z } from 'zod';

export const BoardType = z.enum(['GRID', 'HONEYCOMB', 'CROSS_GRID']);
export type BoardType = z.infer<typeof BoardType>;

export const BoardCellSchema = z.object({
  ownerTeamIds: z.array(z.number()),
  score: z.number().nullable(),
  submissionId: z.number().nullable(),
});
export type BoardCell = z.infer<typeof BoardCellSchema>;

export const BoardStateSchema = z.record(z.string(), BoardCellSchema);
export type BoardState = z.infer<typeof BoardStateSchema>;

// --- Grid Board ---
export const GridBoardConfigSchema = z.object({
  width: z.number(),
  height: z.number(),
  mapping: z.record(z.string(), z.string()), // languageId -> "x_y"
  cellInfo: z.record(
    z.string(),
    z.object({
      label: z.string(),
      languageId: z.number().optional(),
    })
  ),
  startingPositions: z.record(z.string(), z.array(z.string())).optional(), // teamId -> ["x_y"]
  allowMultiOwner: z.boolean().optional(),
});
export type GridBoardConfig = z.infer<typeof GridBoardConfigSchema>;

// --- Honeycomb Board ---
export const HoneycombBoardConfigSchema = z.object({
  cellIds: z.array(z.string()),
  cellInfo: z.record(
    z.string(),
    z.object({
      label: z.string(),
      languageId: z.number().optional(),
      q: z.number(),
      r: z.number(),
    })
  ),
  mapping: z.record(z.string(), z.string()), // languageId -> "q_r"
  startingPositions: z.record(z.string(), z.array(z.string())).optional(),
  size: z.number().optional(),
  allowMultiOwner: z.boolean().optional(),
});
export type HoneycombBoardConfig = z.infer<typeof HoneycombBoardConfigSchema>;

// --- Cross Grid Board ---
export const CrossGridBoardConfigSchema = z.object({
  problemIds: z.array(z.number()),
  languageIds: z.array(z.number()),
  problemInfo: z.record(z.string(), z.string()), // problemId -> title
  languageInfo: z.record(z.string(), z.string()), // languageId -> name
  startingPositions: z.record(z.string(), z.array(z.string())).optional(), // teamId -> ["p_1_l_1"]
  allowMultiOwner: z.boolean().optional(),
});
export type CrossGridBoardConfig = z.infer<typeof CrossGridBoardConfigSchema>;

export type BoardConfig = GridBoardConfig | HoneycombBoardConfig | CrossGridBoardConfig;

export type BoardData = {
  id: number;
  contestId: number;
  type: BoardType;
  config: BoardConfig;
  state: BoardState;
  lastUpdated: string;
};

// --- Submission for Board Engine ---
export type BoardSubmission = {
  id: number;
  userId: string;
  languageId: number;
  problemId: number;
  score: number | null;
  codeLength: number;
  user: {
    teams: { id: number; color: string; contestId: number }[];
  };
};

// --- Engine Interface ---
export interface IBoardEngine<TConfig extends BoardConfig = BoardConfig> {
  calculateUpdate(
    config: TConfig,
    state: BoardState,
    submission: BoardSubmission,
    scoreOrder: 'ASC' | 'DESC'
  ): BoardState;

  // 提出に対してどのセルがターゲットになるかを返す
  getTargetCellId(config: TConfig, submission: BoardSubmission): string | null;

  // 初期状態を生成する（コンテスト作成時用）
  createInitialState(config: TConfig): BoardState;

  // 複数の提出を適用して最終的な状態を返す (再計算用)
  recalculate(
    config: TConfig,
    initialState: BoardState,
    submissions: BoardSubmission[],
    scoreOrder: 'ASC' | 'DESC'
  ): BoardState;
}
