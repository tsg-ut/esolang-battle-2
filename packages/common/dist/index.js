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
export const listProblemsSchema = z.object({
    contestId: z.number().optional(),
});
export const submissionFilterSchema = z.object({
    userId: z.number().optional(),
    teamId: z.number().optional(),
    problemId: z.number().optional(),
    languageId: z.number().optional(),
    contestId: z.number().optional(),
}).optional();
export const testCodeSchema = z.object({
    code: z.string(),
    languageId: z.number(),
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
export const updateUserTeamSchema = z.object({
    userId: z.number(),
    teamId: z.number().nullable(),
});
