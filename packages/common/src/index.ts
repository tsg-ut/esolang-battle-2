import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const registerSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  password: z.string().min(4),
});

export const contestIdSchema = z.object({
  contestId: z.number(),
});

export const problemIdSchema = z.object({
  problemId: z.number(),
});

export const submissionIdSchema = z.object({
  submissionId: z.number(),
});

export const listProblemsSchema = z.object({
  contestId: z.number().optional(),
});

export const submissionFilterSchema = z
  .object({
    userId: z.string().optional(),
    userName: z.string().optional(),
    teamId: z.number().optional(),
    problemId: z.union([z.number(), z.array(z.number())]).optional(),
    languageId: z.union([z.number(), z.array(z.number())]).optional(),
    contestId: z.number().optional(),
    status: z
      .union([
        z.enum(['AC', 'WA', 'TLE', 'RE', 'WJ', 'ALL']),
        z.array(z.enum(['AC', 'WA', 'TLE', 'RE', 'WJ', 'ALL'])),
      ])
      .optional(),
    orderBy: z.enum(['id', 'submittedAt', 'codeLength', 'score']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  })
  .optional();

export const testCodeSchema = z.object({
  code: z.string(),
  languageId: z.number(),
  stdin: z.string().optional(),
});

export const submitCodeSchema = z.object({
  code: z.string().max(2 * 1024 * 1024), // Approx 2MB (handles 1MB binary + Base64 overhead)
  isBase64: z.boolean().optional(),
  languageId: z.number(),
  problemId: z.number(),
});

export const submittableLanguageSchema = z.object({
  teamId: z.number(),
  contestId: z.number(),
});

export const upsertProblemSchema = z.object({
  id: z.number().nullable(),
  contestId: z.number(),
  title: z.string(),
  problemStatement: z.string(),
  checkerType: z.enum(['BUILTIN', 'CUSTOM']).optional(),
  checkerName: z.string().optional(),
  checkerScript: z.string().nullable().optional(),
  checkerConfig: z.any().optional(),
  checkerLanguageId: z.number().nullable().optional(),
  aggregatorType: z.enum(['BUILTIN', 'CUSTOM']).optional(),
  aggregatorName: z.string().optional(),
  aggregatorScript: z.string().nullable().optional(),
  aggregatorConfig: z.any().optional(),
  aggregatorLanguageId: z.number().nullable().optional(),
});

export const upsertContestSchema = z.object({
  id: z.number().nullable(),
  name: z.string(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  isPublic: z.boolean().optional(),
  scoreOrder: z.enum(['ASC', 'DESC']).optional(),
});

export const upsertTeamSchema = z.object({
  id: z.number().nullable(),
  name: z.string().optional(),
  color: z.string(),
  contestId: z.number(),
});

export const upsertLanguageSchema = z.object({
  id: z.number().nullable(),
  name: z.string(),
  description: z.string(),
  dockerImageId: z.string(),
});

export const upsertTestCaseSchema = z.object({
  id: z.number().nullable(),
  problemId: z.number(),
  input: z.string(),
  output: z.string(),
  isSample: z.boolean(),
  checkerScript: z.string().nullable().optional(),
});

export const updateUserTeamSchema = z.object({
  userId: z.string(),
  teamId: z.number().nullable(),
});

export type TeamInfo = {
  id: number;
  color: string;
  contestId: number;
};

export type UserInfo = {
  id: string;
  name: string;
  isAdmin: boolean;
  teams: TeamInfo[];
};

export type LanguageSummary = {
  id: number;
  name: string;
  description: string;
};

export type ProblemSummary = {
  id: number;
  title: string;
};

// --- Judge System Types ---

export type JudgeStatus = 'AC' | 'WA' | 'TLE' | 'RE' | 'WJ';

export type CaseCheckerInput = {
  testCase: {
    input: string;
    expectedOutput: string;
    isSample: boolean;
  };
  execution: {
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
  };
  config: any; // Problem.checkerConfig
};

export type CaseCheckerOutput = {
  status: JudgeStatus;
  score: number; // 個別ケースの点数
  message?: string;
};

export type ScoreAggregatorInput = {
  submission: {
    id: number;
    codeLength: number;
    languageId: number;
  };
  results: {
    testCaseId: number;
    isSample: boolean;
    checkerResult: CaseCheckerOutput;
  }[];
  config: any; // Problem.aggregatorConfig
};

export type ScoreAggregatorOutput = {
  status: JudgeStatus;
  finalScore: number | null;
  summaryMessage?: string;
};

export * from './board';
export * from './config';
