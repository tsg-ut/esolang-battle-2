import { z } from 'zod';

export const BoardType = z.enum(['GRID', 'HONEYCOMB', 'CROSS_GRID', 'TEAM_TARGET']);
export type BoardType = z.infer<typeof BoardType>;

export const BoardCellSchema = z.object({
  ownerTeamIds: z.array(z.number()),
  submissionIds: z.array(z.number()),
  ownerUsers: z.array(z.object({ id: z.string(), name: z.string() })).optional(), // API返却用
  score: z.number().nullable(),
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

// --- Team Target Board ---
// 各セルに (チーム, 言語 and/or 問題) を割り当て、そのチームのメンバーが条件を満たす提出で AC すると
// セルを獲得して config で指定した点数を得る。隣接ルールはなく、一度獲得したセルは失われない。
//   - 目標セル:   { teamId, languageId?, problemId?, label?, score? }
//                 languageId / problemId の少なくとも一方を指定する。指定した条件のみで照合し、
//                 省略した方は任意 (例: { teamId, problemId } はその問題にどの言語で AC しても獲得)。
//                 1 つの提出が複数のセルに一致した場合はすべてに反映する。
//   - 固定セル:   { teamId, label? }  ... 最初からそのチームが所有し、塗り替えられない (得点なし)
//   - ラベルセル: { label }           ... 見出しなどの表示専用
export const TeamTargetCellSchema = z.object({
  label: z.string().optional(),
  teamId: z.number().int().optional(),
  languageId: z.number().int().optional(),
  problemId: z.number().int().optional(),
  score: z.number().optional(),
});
export type TeamTargetCell = z.infer<typeof TeamTargetCellSchema>;

/** 提出で獲得できる目標セル (言語・問題の少なくとも一方を指定) か */
export function isTeamTargetGoalCell(cell: TeamTargetCell) {
  return cell.languageId !== undefined || cell.problemId !== undefined;
}

/** 提出がセルの条件 (チーム・言語・問題) を満たすか */
export function matchesTeamTargetCell(
  cell: TeamTargetCell,
  submission: { teamId: number; languageId: number; problemId: number }
) {
  return (
    isTeamTargetGoalCell(cell) &&
    cell.teamId === submission.teamId &&
    (cell.languageId === undefined || cell.languageId === submission.languageId) &&
    (cell.problemId === undefined || cell.problemId === submission.problemId)
  );
}

export const TeamTargetBoardConfigSchema = z
  .object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    defaultScore: z.number().optional(), // score 未指定の目標セルの点数 (デフォルト: 1)
    cells: z.record(z.string(), TeamTargetCellSchema), // "x_y" -> cell
  })
  .superRefine((config, ctx) => {
    const seen = new Map<string, string>(); // "teamId:languageId:problemId" -> cellId
    for (const [cellId, cell] of Object.entries(config.cells)) {
      const path = ['cells', cellId];
      const match = /^(\d+)_(\d+)$/.exec(cellId);
      if (!match) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `セルID "${cellId}" は "x_y" 形式で指定してください`,
        });
        continue;
      }
      const [x, y] = [Number(match[1]), Number(match[2])];
      if (x >= config.width || y >= config.height) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `セル "${cellId}" が盤面 (${config.width}x${config.height}) の範囲外です`,
        });
      }
      const isGoal = isTeamTargetGoalCell(cell);
      if (isGoal && cell.teamId === undefined) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `languageId / problemId を指定したセル "${cellId}" には teamId が必要です`,
        });
      }
      if (cell.teamId === undefined && cell.label === undefined) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `セル "${cellId}" には teamId か label が必要です`,
        });
      }
      if (cell.score !== undefined && !isGoal) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `score は languageId / problemId を指定したセルにのみ指定できます ("${cellId}")`,
        });
      }
      if (isGoal && cell.teamId !== undefined) {
        const key = `${cell.teamId}:${cell.languageId ?? '*'}:${cell.problemId ?? '*'}`;
        const prev = seen.get(key);
        if (prev) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `チーム ${cell.teamId} × 言語 ${cell.languageId ?? '(任意)'} × 問題 ${cell.problemId ?? '(任意)'} が "${prev}" と "${cellId}" で重複しています`,
          });
        } else {
          seen.set(key, cellId);
        }
      }
    }
  });
export type TeamTargetBoardConfig = z.infer<typeof TeamTargetBoardConfigSchema>;

export const DEFAULT_TEAM_TARGET_SCORE = 1;

/** 目標セルの獲得点数 */
export function getTeamTargetCellScore(config: TeamTargetBoardConfig, cell: TeamTargetCell) {
  return cell.score ?? config.defaultScore ?? DEFAULT_TEAM_TARGET_SCORE;
}

export type BoardConfig =
  | GridBoardConfig
  | HoneycombBoardConfig
  | CrossGridBoardConfig
  | TeamTargetBoardConfig;

/** ボード種別ごとの config スキーマ (保存時の検証用) */
export const BoardConfigSchemas: Record<BoardType, z.ZodType> = {
  GRID: GridBoardConfigSchema,
  HONEYCOMB: HoneycombBoardConfigSchema,
  CROSS_GRID: CrossGridBoardConfigSchema,
  TEAM_TARGET: TeamTargetBoardConfigSchema,
};

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
    name?: string | null;
    image?: string | null;
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
