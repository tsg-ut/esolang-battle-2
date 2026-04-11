import { z } from 'zod';

export const loginSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export const registerSchema = loginSchema;

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
    userId: z.number().optional(),
    teamId: z.number().optional(),
    problemId: z.number().optional(),
    languageId: z.number().optional(),
    contestId: z.number().optional(),
  })
  .optional();

export const testCodeSchema = z.object({
  code: z.string(),
  languageId: z.number(),
  stdin: z.string().optional(),
});

export const submitCodeSchema = z.object({
  code: z.string(),
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
});

export const upsertContestSchema = z.object({
  id: z.number().nullable(),
  name: z.string(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
});

export const upsertTeamSchema = z.object({
  id: z.number().nullable(),
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
  userId: z.number(),
  teamId: z.number().nullable(),
});

export type TeamInfo = {
  id: number;
  color: string;
  contestId: number;
};

export type UserInfo = {
  id: number;
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

export * from './board';
