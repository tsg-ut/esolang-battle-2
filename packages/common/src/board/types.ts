import { z } from 'zod';

export const BoardType = z.enum([
  'GRID',
  'HONEYCOMB',
  'CROSS_GRID',
  'TEAM_TARGET',
  'RANKING_TABLE',
]);
export type BoardType = z.infer<typeof BoardType>;

export const BoardCellSchema = z.object({
  ownerTeamIds: z.array(z.number()),
  submissionIds: z.array(z.number()),
  ownerUsers: z.array(z.object({ id: z.string(), name: z.string() })).optional(), // API返却用
  score: z.number().nullable(),
  // 以下は RANKING_TABLE のみ使用
  codeLength: z.number().optional(), // 最良の提出のバイト数
  languageId: z.number().optional(), // 最良の提出の言語
  rank: z.number().nullable().optional(), // 順位 (提出がなければ null)
  points: z.number().optional(), // 得点
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
//   - 共有セル:   { shared: true, languageId?, problemId?, label?, score? }
//                 目標セルと同じ条件で、どのチームのメンバーでも AC すれば獲得できる。
//                 複数チームが同じセルを獲得でき、獲得したチームそれぞれが score 点を得る。
//   - 固定セル:   { teamId, label? }  ... 最初からそのチームが所有し、塗り替えられない (得点なし)
//   - ラベルセル: { label }           ... 見出しなどの表示専用
export const TeamTargetCellSchema = z.object({
  label: z.string().optional(),
  teamId: z.number().int().optional(),
  shared: z.literal(true).optional(),
  languageId: z.number().int().optional(),
  problemId: z.number().int().optional(),
  score: z.number().optional(),
});
export type TeamTargetCell = z.infer<typeof TeamTargetCellSchema>;

/** 提出で獲得できる目標セル (言語・問題の少なくとも一方を指定) か */
export function isTeamTargetGoalCell(cell: TeamTargetCell) {
  return cell.languageId !== undefined || cell.problemId !== undefined;
}

/** 提出で獲得できるセル (チームの目標セルまたは共有セル) か */
export function isTeamTargetClaimableCell(cell: TeamTargetCell) {
  return isTeamTargetGoalCell(cell) && (cell.teamId !== undefined || cell.shared === true);
}

/** 提出がセルの条件 (チーム・言語・問題) を満たすか。共有セルはどのチームでも満たす */
export function matchesTeamTargetCell(
  cell: TeamTargetCell,
  submission: { teamId: number; languageId: number; problemId: number }
) {
  return (
    isTeamTargetClaimableCell(cell) &&
    (cell.shared === true || cell.teamId === submission.teamId) &&
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
    // 言語・問題の組み合わせごとのセル (共有セルとチームのセルの混在を検出する)
    const sharedTargets = new Map<string, string>(); // "languageId:problemId" -> cellId
    const teamTargets = new Map<string, string>();
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
      if (cell.shared === true && cell.teamId !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `セル "${cellId}" には teamId と shared の一方だけを指定してください`,
        });
      }
      if (cell.shared === true && !isGoal) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `共有セル "${cellId}" には languageId / problemId の少なくとも一方が必要です`,
        });
      }
      if (isGoal && cell.teamId === undefined && cell.shared !== true) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `languageId / problemId を指定したセル "${cellId}" には teamId か shared: true が必要です`,
        });
      }
      if (cell.teamId === undefined && cell.shared !== true && cell.label === undefined) {
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
      if (isGoal && (cell.teamId !== undefined) !== (cell.shared === true)) {
        // 同じ言語・問題の組み合わせに共有セルとチームのセルの両方があると点数が二重になる
        const target = `${cell.languageId ?? '*'}:${cell.problemId ?? '*'}`;
        const [mine, other] =
          cell.shared === true ? [sharedTargets, teamTargets] : [teamTargets, sharedTargets];
        const conflict = other.get(target);
        if (conflict) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `言語 ${cell.languageId ?? '(任意)'} × 問題 ${cell.problemId ?? '(任意)'} に共有セルとチームのセルの両方があります ("${conflict}" と "${cellId}")`,
          });
        }
        if (!mine.has(target)) mine.set(target, cellId);
      }
      if (isGoal && (cell.teamId !== undefined || cell.shared === true)) {
        const owner = cell.shared === true ? 'shared' : String(cell.teamId);
        const key = `${owner}:${cell.languageId ?? '*'}:${cell.problemId ?? '*'}`;
        const prev = seen.get(key);
        if (prev) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `${cell.shared === true ? '共有セル' : `チーム ${cell.teamId}`} × 言語 ${cell.languageId ?? '(任意)'} × 問題 ${cell.problemId ?? '(任意)'} が "${prev}" と "${cellId}" で重複しています`,
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

// --- Ranking Table Board ---
// チームごとに最良の提出を 1 つ記録し、順位表として表示する。最良はコンテストの scoreOrder で判定し、
// 同じスコアなら先の提出を残す。対象の問題・言語以外の提出は無視する。
//   - problemId:   対象の問題 (省略時はコンテスト内の全問題)
//   - languageIds: 対象の言語 (省略時は全言語)
//   - teams:       表に載せるチーム。languageId を指定するとそのチームはその言語の提出のみ対象
//   - points:      得点ルール
//       RANK:  順位 (同じスコアは同じ順位、次の順位は詰める) に応じて values[順位 - 1] 点
//              (values の範囲外は 0 点)。提出のないチームは noSubmissionPoints 点 (デフォルト: values の最後)
//       RATIO: base × 最良スコア / チームのスコア (scoreOrder が DESC なら チームのスコア / 最良スコア)。
//              提出のないチームは noSubmissionPoints 点 (デフォルト: 0)
//   - showMultiplier: 係数 (スコア ÷ バイト数) の列を表示するか
export const RankingTablePointsSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('RANK'),
    values: z.array(z.number()).min(1),
    noSubmissionPoints: z.number().optional(),
  }),
  z.object({
    type: z.literal('RATIO'),
    base: z.number().positive().optional(),
    noSubmissionPoints: z.number().optional(),
  }),
]);
export type RankingTablePoints = z.infer<typeof RankingTablePointsSchema>;

export const DEFAULT_RANKING_TABLE_POINTS: RankingTablePoints = {
  type: 'RANK',
  values: [100, 80, 60],
};
export const DEFAULT_RANKING_TABLE_RATIO_BASE = 100;

export const RankingTableBoardConfigSchema = z
  .object({
    problemId: z.number().int().optional(),
    languageIds: z.array(z.number().int()).min(1).optional(),
    teams: z
      .array(
        z.object({
          teamId: z.number().int(),
          languageId: z.number().int().optional(),
        })
      )
      .min(1),
    points: RankingTablePointsSchema.optional(),
    showMultiplier: z.boolean().optional(),
  })
  .superRefine((config, ctx) => {
    const seen = new Set<number>();
    config.teams.forEach((team, i) => {
      if (seen.has(team.teamId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['teams', i, 'teamId'],
          message: `チーム ${team.teamId} が重複しています`,
        });
      }
      seen.add(team.teamId);
      if (
        team.languageId !== undefined &&
        config.languageIds !== undefined &&
        !config.languageIds.includes(team.languageId)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['teams', i, 'languageId'],
          message: `チーム ${team.teamId} の言語 ${team.languageId} が languageIds に含まれていません`,
        });
      }
    });
  });
export type RankingTableBoardConfig = z.infer<typeof RankingTableBoardConfigSchema>;

/** RANKING_TABLE のセル ID (= チーム ID の文字列) */
export function getRankingTableCellId(teamId: number) {
  return String(teamId);
}

/** 提出が RANKING_TABLE の対象 (問題・言語・チーム) か */
export function matchesRankingTable(
  config: RankingTableBoardConfig,
  submission: { teamId: number; languageId: number; problemId: number }
) {
  const team = config.teams.find((t) => t.teamId === submission.teamId);
  if (!team) return false;
  if (config.problemId !== undefined && config.problemId !== submission.problemId) return false;
  if (config.languageIds !== undefined && !config.languageIds.includes(submission.languageId)) {
    return false;
  }
  if (team.languageId !== undefined && team.languageId !== submission.languageId) return false;
  return true;
}

/** state の各チームに順位 (rank) と得点 (points) を付け直す */
export function rankRankingTable(
  config: RankingTableBoardConfig,
  state: BoardState,
  scoreOrder: 'ASC' | 'DESC'
): BoardState {
  const points = config.points ?? DEFAULT_RANKING_TABLE_POINTS;
  const isBetter = (a: number, b: number) => (scoreOrder === 'ASC' ? a < b : a > b);

  // 提出のあるチームのスコア (重複なし) を良い順に並べる
  const scores = config.teams
    .map((t) => state[getRankingTableCellId(t.teamId)]?.score)
    .filter((s): s is number => s !== null && s !== undefined);
  const distinct = Array.from(new Set(scores)).sort((a, b) => (isBetter(a, b) ? -1 : 1));
  const best = distinct[0];

  const next: BoardState = { ...state };
  for (const team of config.teams) {
    const cellId = getRankingTableCellId(team.teamId);
    const cell = state[cellId] ?? { ownerTeamIds: [], submissionIds: [], score: null };
    let rank: number | null = null;
    let teamPoints: number;
    if (cell.score === null) {
      teamPoints =
        points.noSubmissionPoints ??
        (points.type === 'RANK' ? points.values[points.values.length - 1] : 0);
    } else {
      rank = distinct.indexOf(cell.score) + 1;
      if (points.type === 'RANK') {
        teamPoints = points.values[rank - 1] ?? 0;
      } else {
        const base = points.base ?? DEFAULT_RANKING_TABLE_RATIO_BASE;
        const ratio = scoreOrder === 'ASC' ? best / cell.score : cell.score / best;
        teamPoints = Number.isFinite(ratio) ? base * ratio : 0;
      }
    }
    next[cellId] = { ...cell, rank, points: teamPoints };
  }
  return next;
}

export type BoardConfig =
  | GridBoardConfig
  | HoneycombBoardConfig
  | CrossGridBoardConfig
  | TeamTargetBoardConfig
  | RankingTableBoardConfig;

/** ボード種別ごとの config スキーマ (保存時の検証用) */
export const BoardConfigSchemas: Record<BoardType, z.ZodType> = {
  GRID: GridBoardConfigSchema,
  HONEYCOMB: HoneycombBoardConfigSchema,
  CROSS_GRID: CrossGridBoardConfigSchema,
  TEAM_TARGET: TeamTargetBoardConfigSchema,
  RANKING_TABLE: RankingTableBoardConfigSchema,
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
